// ── Shared Sizing Engine ───────────────────────────────────────────────────────
// Single source of truth for all size recommendation logic.
// Imported by: app/api/v1/calculate-size/route.ts
//              app/api/merchant/test-size/route.ts

// ── Types ──────────────────────────────────────────────────────────────────────

export type SizeChartColumn = { id: string; label: string; quiz_field: string; active?: boolean };
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
  chestScore:   number | null;
  waistScore:   number | null;
  hipsScore:    number | null;
  weightScore:  number | null;
  totalScore:   number;
  heightFactor: number;
  keysFound:    string[];
  keysMissing:  string[];
};

export type DebugInfo = {
  bmi:          number;
  bmiDelta:     number;
  rawBody:      BodyMeasurements;
  shapedBody:   BodyMeasurements;
  finalBody:    BodyMeasurements;
  prefDelta:    number;
  chartHasHCol:    boolean;
  chartHasBodyCols: boolean;
  chartColIds:     string[];
  scores: Record<string, DebugSizeScore>;
  heightFactor:  number;
  garmentType:   string;
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
  garmentType:      string;
  heightFactor:     number;
  isShort?:         boolean;
  debug?:           DebugInfo;
};

// ── Garment-Type Height Factors ────────────────────────────────────────────────
//
// Each garment type has a base and high height factor.
// base = used when height spread across chart is low
// high = used when height clearly differentiates sizes (spread >= 0.40)
// Lower values = chest/waist/hips matter more (shirts, pants)
// Higher values = height matters more (abayas, dresses)

export const GARMENT_FACTORS: Record<string, { base: number; high: number }> = {
  abaya:         { base: 0.60, high: 0.75 }, // long garment — height critical
  jelaba:        { base: 0.58, high: 0.72 },
  dress:         { base: 0.55, high: 0.70 },
  jacket:        { base: 0.38, high: 0.52 }, // upper body — chest/shoulders
  shirt:         { base: 0.28, high: 0.42 }, // chest matters most
  pants:         { base: 0.20, high: 0.32 }, // waist/hips matter most
  kids:          { base: 0.55, high: 0.70 },
  // backward-compat aliases for old niche values
  long_clothing: { base: 0.60, high: 0.75 },
  sports:        { base: 0.40, high: 0.55 },
  other:         { base: 0.50, high: 0.65 },
};

// ── Niche → Garment Type normalization ────────────────────────────────────────
//
// DB may store English values (long_clothing) or Arabic label strings.
// Both are normalized to canonical garment type keys.

export const NICHE_TO_GARMENT: Record<string, string> = {
  // English values (original NICHES)
  long_clothing: "abaya",
  sports:        "sports",
  kids:          "kids",
  other:         "other",
  // Arabic label values (if somehow stored directly)
  "ملابس طويلة (عبايات، جلابيب)": "abaya",
  "ملابس أطفال":                  "kids",
  "ملابس رياضية":                 "sports",
  // New canonical values (pass through)
  abaya:  "abaya",
  jelaba: "jelaba",
  dress:  "dress",
  shirt:  "shirt",
  pants:  "pants",
  jacket: "jacket",
};

export function normalizeGarmentType(niche?: string | null): string {
  if (!niche) return "abaya";
  const mapped = NICHE_TO_GARMENT[niche];
  if (!mapped) {
    console.warn(`[sizing-engine] Unknown niche "${niche}" — defaulting to abaya`);
    return "abaya";
  }
  return mapped;
}

// ── Fit Preference Shifts ──────────────────────────────────────────────────────

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
// Uses garment-type base/high factors instead of fixed constants.
// If height strongly differentiates sizes (high spread) → use high factor.

function computeHeightFactor(heightScores: number[], garmentType: string): number {
  const f = GARMENT_FACTORS[garmentType] ?? GARMENT_FACTORS.other;
  if (heightScores.length < 2) return f.base;
  const max    = Math.max(...heightScores);
  const min    = Math.min(...heightScores);
  const spread = max - min;
  return spread >= 0.40 ? f.high : f.base;
}

// ── Score All Sizes ────────────────────────────────────────────────────────────

export function scoreAllSizes(
  sizeChart:    SizeChart,
  body:         BodyMeasurements,
  height:       number,
  weight:       number,
  garmentType:  string = "abaya",
  debugMode?:   boolean
): { scores: SizeScore[]; heightFactor: number; debugScores?: Record<string, DebugSizeScore> } {
  const colIds      = new Set(sizeChart.columns.map(c => c.id));
  const hasBodyCols = colIds.has("ch") || colIds.has("wa") || colIds.has("hi");

  // Only body columns with active !== false are used in scoring
  const activeCols = new Set(
    sizeChart.columns.filter(c => c.active !== false).map(c => c.id)
  );

  const rawHeightScores = sizeChart.rows.map(row => {
    const hRange = row["h"] as Range | undefined;
    return hRange && hRange.max > hRange.min ? fitScore(height, hRange) : 0.5;
  });
  const heightFactor = computeHeightFactor(rawHeightScores, garmentType);

  const debugScores: Record<string, DebugSizeScore> = {};

  const scores: SizeScore[] = sizeChart.rows.map((row, rowIdx) => {
    const sizeName = String(row.size ?? `row${rowIdx}`);

    let widthScore: number;
    let chestScore:  number | null = null;
    let waistScore:  number | null = null;
    let hipsScore:   number | null = null;
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
        // Skip if column doesn't exist OR is toggled to "display only"
        if (!colIds.has(p.id) || !activeCols.has(p.id)) continue;
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

    const hRange = row["h"] as Range | undefined;
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
        heightScore, widthScore, chestScore, waistScore, hipsScore,
        weightScore, totalScore, heightFactor, keysFound, keysMissing,
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
  garmentType?:   string;
  debug?:         boolean;
}): SizingResult {
  const { sizeChart, height, weight, shoulders, belly,
          userPreference, lang, debug = false } = params;
  const resolvedGarmentType = normalizeGarmentType(params.garmentType);
  const explanation: string[] = [];
  let disclaimer: string | null = null;

  if (sizeChart.rows.length === 0) {
    return {
      recommended: "", recommendedIdx: 0, alternatives: [],
      confidence: 0, explanation: ["Empty size chart"], disclaimer: null,
      wasLengthWarning: false, estimatedBody: { chest: 0, waist: 0, hips: 0 },
      garmentType: resolvedGarmentType, heightFactor: 0,
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
  explanation.push(`Garment type: ${resolvedGarmentType}`);

  // Phase 2+4: Score all sizes
  const colIds = new Set(sizeChart.columns.map(c => c.id));
  const { scores, heightFactor, debugScores } = scoreAllSizes(
    sizeChart, finalBody, height, weight, resolvedGarmentType, debug
  );
  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);

  // Height-lock: constrain candidate range based on garment type
  // Abayas/dresses: strict (±1) — shirts/pants: relaxed or none
  const heightBestRowIdx = [...scores].sort((a, b) => b.heightScore - a.heightScore)[0].rowIdx;
  const garmentBase      = GARMENT_FACTORS[resolvedGarmentType]?.base ?? 0.5;
  const heightLockRange  =
    garmentBase >= 0.55 ? 1                  // abaya/jelaba/dress — strict
    : garmentBase >= 0.35 ? 2               // jacket/kids/sports — relaxed
    : sizeChart.rows.length;                 // shirt/pants — no lock

  const heightLocked = sorted.filter(s => Math.abs(s.rowIdx - heightBestRowIdx) <= heightLockRange);
  const best         = heightLocked[0] ?? sorted[0];

  explanation.push(`Height factor used: ${(heightFactor * 100).toFixed(0)}%`);
  explanation.push(
    `Scores: ${sorted.slice(0, 4)
      .map(s => `${s.sizeName}(h:${(s.heightScore * 100).toFixed(0)}% w:${(s.widthScore * 100).toFixed(0)}% t:${(s.totalScore * 100).toFixed(0)}%)`)
      .join(", ")}`
  );

  // Phase 5: Length warning
  const heightBestIdx    = heightBestRowIdx;
  const bodyBestIdx      = [...scores].sort((a, b) => b.widthScore - a.widthScore)[0].rowIdx;
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
    garmentType:    resolvedGarmentType,
    heightFactor,
  };

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
      garmentType:      resolvedGarmentType,
      winner:           best.sizeName,
      winnerScore:      Math.round(best.totalScore * 1000) / 1000,
      runnerUp:         sorted[1]?.sizeName ?? "—",
      runnerUpScore:    Math.round((sorted[1]?.totalScore ?? 0) * 1000) / 1000,
    };
  }

  return result;
}

// ── Deterministic Dual-Strategy Engine ────────────────────────────────────────
//
// Abaya/Jelaba: height is the primary anchor.
//   Result index = MAX(height_idx, weight_idx)  ← "Abaya Floor" rule.
//   Fine-tune: if estimated chest > garment ch.max at result row → go up one size.
//
// Shirt/Dress/Jacket: estimated chest is the primary anchor.
//   Height is secondary — only sets is_short flag (never upsizes for height).
//   Weight nudges up if significantly larger than chest-recommended size.

function findBestRowByField(
  rows: SizeChartRow[],
  fieldId: string,
  value: number
): number {
  let bestIdx = 0;
  let bestScore = -1;
  rows.forEach((row, idx) => {
    const range = row[fieldId] as Range | undefined;
    if (!range || typeof range.min !== "number" || typeof range.max !== "number") return;
    const s = fitScore(value, range);
    if (s > bestScore) { bestScore = s; bestIdx = idx; }
  });
  return bestIdx;
}

type CalcParams = Parameters<typeof calculateSize>[0];

function emptyDeterministicResult(resolvedNiche: string): SizingResult {
  return {
    recommended: "", recommendedIdx: 0, alternatives: [], confidence: 0,
    explanation: ["Empty size chart"], disclaimer: null, wasLengthWarning: false,
    estimatedBody: { chest: 0, waist: 0, hips: 0 },
    garmentType: resolvedNiche, heightFactor: 0,
  };
}

function calculateAbayaDeterministic(params: CalcParams, resolvedNiche: string): SizingResult {
  const { sizeChart, height, weight, shoulders, belly, userPreference, lang } = params;
  const rows = sizeChart.rows;
  if (rows.length === 0) return emptyDeterministicResult(resolvedNiche);

  const rawBody   = estimateBody(height, weight);
  const shaped    = applyBodyShape(rawBody, shoulders, belly);
  const finalBody = applyFitPreference(shaped, userPreference);
  const explanation: string[] = [];

  // Step 1: height index (primary)
  const heightIdx = findBestRowByField(rows, "h", height);
  explanation.push(`Height ${height}cm → ${rows[heightIdx]?.size ?? "?"} (idx ${heightIdx})`);

  // Step 2: weight index (secondary)
  const weightIdx = findBestRowByField(rows, "w", weight);
  explanation.push(`Weight ${weight}kg → ${rows[weightIdx]?.size ?? "?"} (idx ${weightIdx})`);

  // Step 3: Abaya floor rule — never too short
  let bestIdx = Math.max(heightIdx, weightIdx);
  if (weightIdx > heightIdx) {
    explanation.push(`Floor rule: weight idx (${weightIdx}) > height idx (${heightIdx}) → use ${rows[bestIdx]?.size}`);
  }

  // Step 4: chest fine-tune
  const hasCh = sizeChart.columns.some(c => c.id === "ch" && c.active !== false);
  if (hasCh && bestIdx < rows.length - 1) {
    const garmentCh = (rows[bestIdx]["ch"] as Range)?.max;
    if (garmentCh && finalBody.chest > garmentCh) {
      bestIdx = Math.min(bestIdx + 1, rows.length - 1);
      explanation.push(`Chest fine-tune: estimated ${finalBody.chest}cm > garment ${garmentCh}cm → up to ${rows[bestIdx]?.size}`);
    }
  }

  const best        = rows[bestIdx];
  const heightFactor = GARMENT_FACTORS[resolvedNiche]?.base ?? 0.6;
  const hRange      = best["h"] as Range | undefined;
  const confidence  = hRange ? Math.round(fitScore(height, hRange) * 100) : 70;

  const alternatives = ([] as (string | null)[])
    .concat(bestIdx > 0 ? String(rows[bestIdx - 1].size) : null)
    .concat(bestIdx < rows.length - 1 ? String(rows[bestIdx + 1].size) : null)
    .filter((s): s is string => s !== null)
    .slice(0, 2);

  return {
    recommended: String(best.size), recommendedIdx: bestIdx,
    alternatives, confidence, explanation,
    disclaimer: null, wasLengthWarning: false,
    estimatedBody: rawBody, garmentType: resolvedNiche, heightFactor,
  };
}

function calculateShirtDeterministic(params: CalcParams, resolvedNiche: string): SizingResult {
  const { sizeChart, height, weight, shoulders, belly, userPreference, lang } = params;
  const rows = sizeChart.rows;
  if (rows.length === 0) return emptyDeterministicResult(resolvedNiche);

  const rawBody   = estimateBody(height, weight);
  const shaped    = applyBodyShape(rawBody, shoulders, belly);
  const finalBody = applyFitPreference(shaped, userPreference);
  const explanation: string[] = [];

  explanation.push(`Estimated chest: ${finalBody.chest}cm`);

  // Step 1: chest is primary anchor
  const hasCh = sizeChart.columns.some(c => c.id === "ch");
  let bestIdx = hasCh
    ? findBestRowByField(rows, "ch", finalBody.chest)
    : findBestRowByField(rows, "w", weight);
  explanation.push(`Chest → ${rows[bestIdx]?.size ?? "?"} (idx ${bestIdx})`);

  // Step 2: weight nudge (if weight suggests significantly larger size)
  const weightIdx = findBestRowByField(rows, "w", weight);
  if (weightIdx > bestIdx + 1) {
    bestIdx = Math.min(bestIdx + 1, rows.length - 1);
    explanation.push(`Weight nudge → idx ${bestIdx}`);
  }

  // Step 3: is_short flag — tall user for chosen chest size (do NOT upsize)
  const maxHForSize = Number((rows[bestIdx]["h"] as Range)?.max ?? 300);
  const isShort = height > maxHForSize + 5;
  if (isShort) {
    explanation.push(`is_short: height ${height}cm > size max ${maxHForSize}cm`);
  }

  const best         = rows[bestIdx];
  const heightFactor = GARMENT_FACTORS[resolvedNiche]?.base ?? 0.3;
  const chRange      = best["ch"] as Range | undefined;
  const confidence   = chRange ? Math.round(fitScore(finalBody.chest, chRange) * 100) : 70;

  const alternatives = ([] as (string | null)[])
    .concat(bestIdx > 0 ? String(rows[bestIdx - 1].size) : null)
    .concat(bestIdx < rows.length - 1 ? String(rows[bestIdx + 1].size) : null)
    .filter((s): s is string => s !== null)
    .slice(0, 2);

  const disclaimer = isShort
    ? (lang === "Arabic"
        ? "ملاحظة: طولك أعلى من المعتاد لهذا المقاس — الثوب قد يبدو قصيراً قليلاً"
        : "Note: you are taller than usual for this size — the garment may appear slightly short")
    : null;

  return {
    recommended: String(best.size), recommendedIdx: bestIdx,
    alternatives, confidence, explanation,
    disclaimer, wasLengthWarning: isShort,
    estimatedBody: rawBody, garmentType: resolvedNiche, heightFactor, isShort,
  };
}

export function calculateSizeDeterministic(params: CalcParams): SizingResult {
  const resolvedNiche = normalizeGarmentType(params.garmentType);
  switch (resolvedNiche) {
    case "abaya":
    case "jelaba":
      return calculateAbayaDeterministic(params, resolvedNiche);
    case "shirt":
    case "dress":
    case "jacket":
      return calculateShirtDeterministic(params, resolvedNiche);
    default:
      return calculateSize(params);
  }
}
