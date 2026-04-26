// ── Shared Sizing Engine ───────────────────────────────────────────────────────
// Single source of truth for all size recommendation logic.
// Imported by: app/api/calculate-size/route.ts
//              app/api/merchant/test-size/route.ts

// ── Types ──────────────────────────────────────────────────────────────────────

export type SizeChartColumn = { id: string; label: string; quiz_field: string };
export type SizeChartRow    = Record<string, unknown>;
export type SizeChart       = { columns: SizeChartColumn[]; rows: SizeChartRow[] };
export type Range           = { min: number; max: number };

export type BodyMeasurements = {
  chest: number; // cm
  waist: number; // cm
  hips:  number; // cm
};

export type SizeScore = {
  sizeName:    string;
  rowIdx:      number;
  widthScore:  number;
  heightScore: number;
  totalScore:  number;
};

// ── Debug Types ────────────────────────────────────────────────────────────────

export type DebugSizeScore = {
  heightScore:  number;
  widthScore:   number;
  chestScore:   number | null;  // null = column absent in chart
  waistScore:   number | null;
  hipsScore:    number | null;
  weightScore:  number | null;  // fallback if no body cols
  totalScore:   number;
  heightFactor: number;         // factor used for this row
  keysFound:    string[];       // which keys were non-null in DB row
  keysMissing:  string[];       // expected keys that were undefined/null
};

export type DebugInfo = {
  // Estimation audit
  bmi:          number;
  bmiDelta:     number;
  rawBody:      BodyMeasurements;  // before shape adjustments
  shapedBody:   BodyMeasurements;  // after shoulders/belly
  finalBody:    BodyMeasurements;  // after fit preference
  prefDelta:    number;            // cm shift applied for preference

  // Chart validation
  chartHasHCol:    boolean;
  chartHasBodyCols: boolean;
  chartColIds:     string[];

  // Score breakdown per size
  scores: Record<string, DebugSizeScore>;

  // Final decision
  heightFactor:  number;   // factor actually used (dynamic)
  winner:        string;
  winnerScore:   number;
  runnerUp:      string;
  runnerUpScore: number;
};

export type SizingResult = {
  recommended:      string;
  recommendedIdx:   number;
  alternatives:     string[];
  confidence:       number;
  explanation:      string[];
  disclaimer:       string | null;
  wasLengthWarning: boolean;
  estimatedBody:    BodyMeasurements;
  debug?:           DebugInfo;     // only present when debug=true
};

// ── Constants ──────────────────────────────────────────────────────────────────

// Base height weight. Will be boosted dynamically when height strongly
// differentiates sizes (tall person outside most ranges → height must win).
const BASE_HEIGHT_FACTOR = 0.55;
const HIGH_HEIGHT_FACTOR = 0.75; // used when height spread > 0.4 across chart

// Fit preference shifts effective measurements (cm), not size jumps.
const PREF_DELTA: Record<string, number> = { fitted: -2, regular: 0, loose: 3 };

// ── Body Estimation ────────────────────────────────────────────────────────────
//
// Derives chest / waist / hips (cm) from height + weight.
// Anchored at reference BMI 22, calibrated for Arab female proportions.
//
// Verified:
//   165/65 kg → chest 93.3, waist 78.3, hips 101.2  (S ✓)
//   170/70 kg → chest 96.6, waist 81.4, hips 104.7  (M ✓)
//   170/80 kg → chest 104.3, waist 91.9, hips 111.7 (L ✓)

export function estimateBody(height: number, weight: number): BodyMeasurements {
  const bmi      = weight / Math.pow(height / 100, 2);
  const bmiDelta = bmi - 22;
  return {
    chest: Math.round((height * 0.540 + bmiDelta * 2.2) * 10) / 10,
    waist: Math.round((height * 0.440 + bmiDelta * 3.0) * 10) / 10,
    hips:  Math.round((height * 0.590 + bmiDelta * 2.0) * 10) / 10,
  };
}

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

export function applyFitPreference(
  body:       BodyMeasurements,
  preference: string
): BodyMeasurements {
  const delta = PREF_DELTA[preference] ?? 0;
  return {
    chest: body.chest + delta,
    waist: body.waist + delta,
    hips:  body.hips  + delta,
  };
}

// ── Continuous Fit Score ───────────────────────────────────────────────────────
//
// 1.00 at center, 0.70 at boundary, smooth decay outside.
// Tight penalty > loose penalty (can't stretch a small garment).

export function fitScore(value: number, range: Range, stretchBuffer = 0): number {
  if (range.max <= range.min) return 0.5;

  const center   = (range.min + range.max) / 2;
  const halfSpan = (range.max - range.min) / 2;
  const adjMax   = range.max + stretchBuffer;

  if (value >= range.min && value <= adjMax) {
    const distFromCenter = Math.abs(value - center);
    const maxDist        = Math.max(adjMax - center, halfSpan);
    return 1.0 - (distFromCenter / maxDist) * 0.30;
  }

  if (value < range.min) {
    const gap = range.min - value;
    return Math.max(0, 0.70 - (gap / halfSpan) * 0.55);
  }

  const gap = value - adjMax;
  return Math.max(0, 0.70 - (gap / halfSpan) * 0.90);
}

// ── Dynamic Height Factor ──────────────────────────────────────────────────────
//
// If height clearly differentiates sizes (high spread across height scores),
// boost HEIGHT_FACTOR so a tall person isn't dragged down by body scores.
// This fixes the "tall person gets S" bug when body is slim but height is L/XL.

function computeHeightFactor(heightScores: number[]): number {
  if (heightScores.length < 2) return BASE_HEIGHT_FACTOR;
  const max    = Math.max(...heightScores);
  const min    = Math.min(...heightScores);
  const spread = max - min;
  // High spread = height strongly differentiates → give it more authority
  return spread >= 0.40 ? HIGH_HEIGHT_FACTOR : BASE_HEIGHT_FACTOR;
}

// ── Score All Sizes ────────────────────────────────────────────────────────────

export function scoreAllSizes(
  sizeChart:    SizeChart,
  body:         BodyMeasurements,
  height:       number,
  weight:       number,
  debugMode?:   boolean
): { scores: SizeScore[]; heightFactor: number; debugScores?: Record<string, DebugSizeScore> } {
  const colIds      = new Set(sizeChart.columns.map(c => c.id));
  const hasBodyCols = colIds.has("ch") || colIds.has("wa") || colIds.has("hi");

  // First pass: compute all heightScores to determine dynamic factor
  const rawHeightScores = sizeChart.rows.map(row => {
    const hRange = row["h"] as Range | undefined;
    return hRange && hRange.max > hRange.min ? fitScore(height, hRange) : 0.5;
  });
  const heightFactor = computeHeightFactor(rawHeightScores);

  const debugScores: Record<string, DebugSizeScore> = {};

  const scores: SizeScore[] = sizeChart.rows.map((row, rowIdx) => {
    const sizeName = String(row.size ?? `row${rowIdx}`);

    // ── Width score ──────────────────────────────────────────────────────
    let widthScore: number;
    let chestScore: number | null = null;
    let waistScore: number | null = null;
    let hipsScore:  number | null = null;
    let weightScore: number | null = null;
    const keysFound:   string[] = [];
    const keysMissing: string[] = [];

    if (hasBodyCols) {
      const parts = [
        { id: "ch", measure: body.chest, w: 0.50 },
        { id: "wa", measure: body.waist, w: 0.30 },
        { id: "hi", measure: body.hips,  w: 0.20 },
      ];
      let totalW = 0, totalS = 0;
      for (const p of parts) {
        if (!colIds.has(p.id)) continue;
        const range = row[p.id] as Range | undefined;
        if (!range || typeof range.min !== "number" || typeof range.max !== "number") {
          keysMissing.push(p.id);
          continue;
        }
        keysFound.push(p.id);
        const s = fitScore(p.measure, range);
        totalW += p.w;
        totalS += p.w * s;
        if (p.id === "ch") chestScore = s;
        if (p.id === "wa") waistScore = s;
        if (p.id === "hi") hipsScore  = s;
      }
      widthScore = totalW > 0 ? totalS / totalW : 0.5;
    } else {
      const wRange = row["w"] as Range | undefined;
      if (wRange && typeof wRange.min === "number") {
        weightScore = fitScore(weight, wRange);
        widthScore  = weightScore;
        keysFound.push("w");
      } else {
        widthScore = 0.5;
        keysMissing.push("w");
      }
    }

    // ── Height score ─────────────────────────────────────────────────────
    const hRange      = row["h"] as Range | undefined;
    let heightScore: number;
    if (hRange && typeof hRange.min === "number" && typeof hRange.max === "number") {
      heightScore = fitScore(height, hRange);
      keysFound.push("h");
    } else {
      heightScore = 0.5;
      keysMissing.push("h");
    }

    const totalScore = widthScore * (1 - heightFactor) + heightScore * heightFactor;

    if (debugMode) {
      debugScores[sizeName] = {
        heightScore,
        widthScore,
        chestScore,
        waistScore,
        hipsScore,
        weightScore,
        totalScore,
        heightFactor,
        keysFound,
        keysMissing,
      };
    }

    return { sizeName, rowIdx, widthScore, heightScore, totalScore };
  });

  return { scores, heightFactor, debugScores: debugMode ? debugScores : undefined };
}

// ── Main Engine ────────────────────────────────────────────────────────────────

export function calculateSize(params: {
  sizeChart:      SizeChart;
  height:         number;
  weight:         number;
  shoulders:      string;
  belly:          string;
  userPreference: string;
  lang:           string;
  debug?:         boolean;
}): SizingResult {
  const { sizeChart, height, weight, shoulders, belly,
          userPreference, lang, debug = false } = params;
  const explanation: string[] = [];
  let disclaimer: string | null = null;

  if (sizeChart.rows.length === 0) {
    return {
      recommended: "", recommendedIdx: 0, alternatives: [],
      confidence: 0, explanation: ["Empty size chart"], disclaimer: null,
      wasLengthWarning: false, estimatedBody: { chest: 0, waist: 0, hips: 0 },
    };
  }

  // Phase 0+1: Estimate body
  const bmi      = weight / Math.pow(height / 100, 2);
  const bmiDelta = bmi - 22;
  const rawBody    = estimateBody(height, weight);
  const shapedBody = applyBodyShape(rawBody, shoulders, belly);
  const prefDelta  = PREF_DELTA[userPreference] ?? 0;
  const finalBody  = applyFitPreference(shapedBody, userPreference);

  explanation.push(
    `Estimated body: chest ${rawBody.chest}cm, waist ${rawBody.waist}cm, hips ${rawBody.hips}cm`
  );
  if (shoulders !== "average" || belly !== "average") {
    explanation.push(`Shape modifiers: shoulders=${shoulders}, belly=${belly}`);
  }

  // Phase 2+4: Score all sizes (with dynamic height factor)
  const colIds       = new Set(sizeChart.columns.map(c => c.id));
  const { scores, heightFactor, debugScores } = scoreAllSizes(
    sizeChart, finalBody, height, weight, debug
  );
  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);

  // Height-lock: only consider ±1 size from height-best to prevent too-long garments
  const heightBestRowIdx = [...scores].sort((a, b) => b.heightScore - a.heightScore)[0].rowIdx;
  const heightLocked     = sorted.filter(s => Math.abs(s.rowIdx - heightBestRowIdx) <= 1);
  const best             = heightLocked[0] ?? sorted[0];

  explanation.push(`Height factor used: ${(heightFactor * 100).toFixed(0)}%`);
  explanation.push(
    `Scores: ${sorted.slice(0, 4)
      .map(s => `${s.sizeName}(h:${(s.heightScore * 100).toFixed(0)}% w:${(s.widthScore * 100).toFixed(0)}% t:${(s.totalScore * 100).toFixed(0)}%)`)
      .join(", ")}`
  );

  // Phase 5: Length warning
  const heightBestIdx    = heightBestRowIdx;
  const bodyBestIdx      = [...scores].sort((a, b) => b.widthScore  - a.widthScore)[0].rowIdx;
  const wasLengthWarning = Math.abs(heightBestIdx - bodyBestIdx) > 2;

  if (wasLengthWarning) {
    disclaimer = lang === "Arabic"
      ? "تنبيه: هناك فارق كبير بين مقاس الطول ومقاس الجسم — قد تحتاج العباءة إلى تقصير."
      : "Note: significant height-to-body mismatch — the garment may need length adjustment.";
    explanation.push("Length warning: height-best and body-best differ by >2 sizes");
  }

  // Phase 6: Confidence
  const topScore    = best.totalScore;
  const secondScore = sorted[1]?.totalScore ?? 0;
  const gap         = topScore - secondScore;
  const clarity     = Math.min(gap * 4, 1);
  const confidence  = Math.round((topScore * 0.70 + topScore * clarity * 0.30) * 100);

  const alternatives = sorted
    .slice(1, 3)
    .filter(s => s.totalScore > 0.30)
    .map(s => s.sizeName);

  const result: SizingResult = {
    recommended:    best.sizeName,
    recommendedIdx: best.rowIdx,
    alternatives,
    confidence,
    explanation,
    disclaimer,
    wasLengthWarning,
    estimatedBody:  rawBody,
  };

  // Debug object
  if (debug && debugScores) {
    result.debug = {
      bmi:      Math.round(bmi * 10) / 10,
      bmiDelta: Math.round(bmiDelta * 10) / 10,
      rawBody,
      shapedBody,
      finalBody,
      prefDelta,
      chartHasHCol:     colIds.has("h"),
      chartHasBodyCols: colIds.has("ch") || colIds.has("wa") || colIds.has("hi"),
      chartColIds:      [...colIds],
      scores:           debugScores,
      heightFactor,
      winner:           best.sizeName,
      winnerScore:      Math.round(best.totalScore * 1000) / 1000,
      runnerUp:         sorted[1]?.sizeName ?? "—",
      runnerUpScore:    Math.round((sorted[1]?.totalScore ?? 0) * 1000) / 1000,
    };
  }

  return result;
}
