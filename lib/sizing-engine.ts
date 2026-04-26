// ── Shared Sizing Engine ───────────────────────────────────────────────────────
// Single source of truth for all size recommendation logic.
// Imported by: app/api/calculate-size/route.ts
//              app/api/merchant/test-size/route.ts

// ── Types ──────────────────────────────────────────────────────────────────────

export type SizeChartColumn  = { id: string; label: string; quiz_field: string };
export type SizeChartRow     = Record<string, unknown>;
export type SizeChart        = { columns: SizeChartColumn[]; rows: SizeChartRow[] };
export type Range            = { min: number; max: number };
export type FabricStretchLevel = 0 | 1 | 2;

export type BodyMeasurements = {
  chest: number; // cm
  waist: number; // cm
  hips:  number; // cm
};

export type SizeScore = {
  sizeName:    string;
  rowIdx:      number;
  widthScore:  number;  // 0–1, body fit quality
  heightScore: number;  // 0–1, height fit quality
  totalScore:  number;  // weighted combination
};

export type SizingResult = {
  recommended:      string;
  recommendedIdx:   number;
  alternatives:     string[];  // top 2 by score (excluding recommended)
  confidence:       number;    // 0–100
  explanation:      string[];  // debug + AI prompt data
  disclaimer:       string | null;
  wasLengthWarning: boolean;
  estimatedBody:    BodyMeasurements;
};

// ── Constants ──────────────────────────────────────────────────────────────────

// Stretch expands the effective upper boundary for body measurements.
// Stretchy fabrics can accommodate customers slightly above the size range.
export const STRETCH_BUFFER: Record<FabricStretchLevel, number> = { 0: 0, 1: 2, 2: 4 };

// For floor-length garments, length error is as costly as width error.
const HEIGHT_FACTOR = 0.50;

// Fit preference shifts the customer's effective measurements (cm), not size jumps.
const PREF_DELTA: Record<string, number> = { fitted: -2, regular: 0, loose: 3 };

// ── Phase 0+1: Body Estimation ─────────────────────────────────────────────────
//
// Derives chest / waist / hips (cm) from height + weight using proportional
// scaling anchored at reference BMI 22, calibrated for Arab female proportions.
//
// Verified calibration:
//   165 cm / 65 kg  → chest 93.3, waist 78.3, hips 101.2  (S range ✓)
//   170 cm / 70 kg  → chest 96.6, waist 81.4, hips 104.7  (M range ✓)
//   170 cm / 80 kg  → chest 104.3, waist 91.9, hips 111.7 (L range ✓)

export function estimateBody(height: number, weight: number): BodyMeasurements {
  const bmi      = weight / Math.pow(height / 100, 2);
  const bmiDelta = bmi - 22;
  return {
    chest: Math.round((height * 0.540 + bmiDelta * 2.2) * 10) / 10,
    waist: Math.round((height * 0.440 + bmiDelta * 3.0) * 10) / 10,
    hips:  Math.round((height * 0.590 + bmiDelta * 2.0) * 10) / 10,
  };
}

// Qualitative body-shape adjustments on top of the estimated baseline.
export function applyBodyShape(
  body:      BodyMeasurements,
  shoulders: string,
  belly:     string
): BodyMeasurements {
  let { chest, waist, hips } = body;
  if (shoulders === "wide")   { chest += 4; hips  += 1; }
  if (shoulders === "narrow") { chest -= 3; }
  if (belly === "big")        { waist += 7; hips  += 3; }
  if (belly === "flat")       { waist -= 3; }
  return { chest, waist, hips };
}

// Phase 3: shifts effective measurements so score-based selection reflects preference.
// slim+loose gets an extra +2 cm because slim cuts leave less room to absorb looseness.
export function applyFitPreference(
  body:       BodyMeasurements,
  preference: string,
  fitType:    string
): BodyMeasurements {
  let delta = PREF_DELTA[preference] ?? 0;
  if (fitType === "slim" && preference === "loose") delta += 2;
  return {
    chest: body.chest + delta,
    waist: body.waist + delta,
    hips:  body.hips  + delta,
  };
}

// ── Phase 2+4: Continuous Fit Score ───────────────────────────────────────────
//
// Returns 0.0–1.0 with no cliff edges:
//   1.00  — perfect center of range
//   0.70  — at range boundary (or adjMax with stretch)
//   < 0.70 — outside range, heavier penalty for too-tight than too-loose
//
// stretchBuffer expands the effective upper limit for stretchy fabrics.

export function fitScore(value: number, range: Range, stretchBuffer: number): number {
  if (range.max <= range.min) return 0.5;

  const center   = (range.min + range.max) / 2;
  const halfSpan = (range.max - range.min) / 2;
  const adjMax   = range.max + stretchBuffer;

  if (value >= range.min && value <= adjMax) {
    // Inside effective range: linear from 1.0 (center) to 0.70 (edge)
    const distFromCenter = Math.abs(value - center);
    const maxDist        = Math.max(adjMax - center, halfSpan);
    return 1.0 - (distFromCenter / maxDist) * 0.30;
  }

  if (value < range.min) {
    // Under range: garment too loose — moderate penalty (acceptable for abayas)
    const gap = range.min - value;
    return Math.max(0, 0.70 - (gap / halfSpan) * 0.55);
  }

  // Over adjusted max: garment too tight — heavier penalty
  const gap = value - adjMax;
  return Math.max(0, 0.70 - (gap / halfSpan) * 0.90);
}

// ── Score All Size Rows ────────────────────────────────────────────────────────
//
// If the chart contains body-measurement columns (ch/wa/hi), scores in cm vs cm.
// Falls back to weight vs weight range (kg vs kg) for legacy charts.
// Height is always scored against the h column, no stretch applied.

export function scoreAllSizes(
  sizeChart:  SizeChart,
  body:       BodyMeasurements,
  height:     number,
  weight:     number,
  stretchBuf: number
): SizeScore[] {
  const colIds      = new Set(sizeChart.columns.map(c => c.id));
  const hasBodyCols = colIds.has("ch") || colIds.has("wa") || colIds.has("hi");

  return sizeChart.rows.map((row, rowIdx) => {
    let widthScore: number;

    if (hasBodyCols) {
      // Weighted body-measurement score: chest 50%, waist 30%, hips 20%
      const parts = [
        { id: "ch", measure: body.chest, w: 0.50 },
        { id: "wa", measure: body.waist, w: 0.30 },
        { id: "hi", measure: body.hips,  w: 0.20 },
      ];
      let totalW = 0, totalS = 0;
      for (const p of parts) {
        if (!colIds.has(p.id)) continue;
        const range = row[p.id] as Range | undefined;
        if (!range) continue;
        totalW += p.w;
        totalS += p.w * fitScore(p.measure, range, stretchBuf);
      }
      widthScore = totalW > 0 ? totalS / totalW : 0.5;
    } else {
      // Fallback: weight column only (same units — no estimation needed)
      const wRange = row["w"] as Range | undefined;
      widthScore   = wRange ? fitScore(weight, wRange, 0) : 0.5;
    }

    const hRange      = row["h"] as Range | undefined;
    const heightScore = hRange ? fitScore(height, hRange, 0) : 0.5;
    const totalScore  = widthScore * (1 - HEIGHT_FACTOR) + heightScore * HEIGHT_FACTOR;

    return { sizeName: String(row.size ?? ""), rowIdx, widthScore, heightScore, totalScore };
  });
}

// ── Main Engine ────────────────────────────────────────────────────────────────
//
// Orchestrates all phases and returns a complete SizingResult.
// Does NOT handle stock checks (caller's responsibility in calculate-size route).

export function calculateSize(params: {
  sizeChart:          SizeChart;
  height:             number;
  weight:             number;
  shoulders:          string;
  belly:              string;
  fitType:            string;
  userPreference:     string;
  lang:               string;
  fabricStretchLevel: FabricStretchLevel;
}): SizingResult {
  const { sizeChart, height, weight, shoulders, belly,
          fitType, userPreference, lang, fabricStretchLevel } = params;
  const explanation: string[] = [];
  let disclaimer: string | null = null;

  if (sizeChart.rows.length === 0) {
    return {
      recommended: "", recommendedIdx: 0, alternatives: [],
      confidence: 0, explanation: ["Empty size chart"], disclaimer: null,
      wasLengthWarning: false, estimatedBody: { chest: 0, waist: 0, hips: 0 },
    };
  }

  // Phase 0+1: Estimate and adjust body measurements
  const rawBody    = estimateBody(height, weight);
  const shapedBody = applyBodyShape(rawBody, shoulders, belly);
  const finalBody  = applyFitPreference(shapedBody, userPreference, fitType);

  explanation.push(
    `Estimated body: chest ${rawBody.chest}cm, waist ${rawBody.waist}cm, hips ${rawBody.hips}cm`
  );
  if (shoulders !== "average" || belly !== "average") {
    explanation.push(`Shape modifiers applied: shoulders=${shoulders}, belly=${belly}`);
  }

  // Phase 2+4: Score every size row
  const stretchBuf = STRETCH_BUFFER[fabricStretchLevel];
  const scores     = scoreAllSizes(sizeChart, finalBody, height, weight, stretchBuf);
  const sorted     = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  const best       = sorted[0];

  explanation.push(
    `Scores: ${sorted.slice(0, 3)
      .map(s => `${s.sizeName}(${(s.totalScore * 100).toFixed(0)}%)`)
      .join(", ")}`
  );

  // Phase 5: Length warning — fires when height-best and body-best differ by > 2 sizes
  const heightBestIdx    = [...scores].sort((a, b) => b.heightScore - a.heightScore)[0].rowIdx;
  const bodyBestIdx      = [...scores].sort((a, b) => b.widthScore  - a.widthScore)[0].rowIdx;
  const wasLengthWarning = Math.abs(heightBestIdx - bodyBestIdx) > 2;

  if (wasLengthWarning) {
    disclaimer = lang === "Arabic"
      ? "تنبيه: هناك فارق كبير بين مقاس الطول ومقاس الجسم — قد تحتاج العباءة إلى تقصير."
      : "Note: significant height-to-body mismatch — the garment may need length adjustment.";
    explanation.push("Length warning: height-best and body-best differ by >2 sizes");
  }

  // Oversized + fitted preference: inform customer, do not change size
  if (fitType === "oversized" && userPreference === "fitted") {
    const note = lang === "Arabic"
      ? "هذا الطراز مصمم ليكون فضفاضاً بطبيعته — هذا هو المقاس المناسب"
      : "This style is intentionally oversized — this is the correct size for you.";
    disclaimer = disclaimer ? `${disclaimer} | ${note}` : note;
  }

  // Phase 6: Confidence — combines score quality with top-2 gap clarity
  const topScore    = best.totalScore;
  const secondScore = sorted[1]?.totalScore ?? 0;
  const gap         = topScore - secondScore;
  const clarity     = Math.min(gap * 4, 1);
  const confidence  = Math.round((topScore * 0.70 + topScore * clarity * 0.30) * 100);

  const alternatives = sorted
    .slice(1, 3)
    .filter(s => s.totalScore > 0.30)
    .map(s => s.sizeName);

  return {
    recommended:    best.sizeName,
    recommendedIdx: best.rowIdx,
    alternatives,
    confidence,
    explanation,
    disclaimer,
    wasLengthWarning,
    estimatedBody:  rawBody,
  };
}
