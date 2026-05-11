export type FabricType  = "stretch" | "semi" | "rigid";
export type Preference  = "slim" | "regular" | "loose";
export type Gender      = "female" | "male";
export type BodyShape   = "hourglass" | "pear" | "apple" | "rectangle";

export type SizeRow = {
  size:        string;
  bust_min:    number; bust_max:    number;
  waist_min:   number; waist_max:   number;
  hip_min:     number; hip_max:     number;
  length_min:  number; length_max:  number;
};

export type AlgoInput = {
  niche:           string;
  gender:          Gender;
  height:          number;
  bust:            number;
  waist:           number;
  hip:             number;
  shoulder_offset: -2 | 0 | 2;
  preference:      Preference;
  fabric_type:     FabricType;
  size_chart:      SizeRow[];
};

export type SizeResult = {
  size:         string;
  confidence:   number;
  alternatives: string[];
  body_shape:   BodyShape;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

type UnderPolicy = "normal" | "allow" | "block" | "fitted";

function scoreRange(
  bodyVal:     number,
  min:         number,
  max:         number,
  fabric:      FabricType,
  underPolicy: UnderPolicy = "normal"
): number {
  if (bodyVal >= min && bodyVal <= max) return 1.0;

  const underShoot = min - bodyVal;
  const overShoot  = bodyVal - max;

  if (underShoot > 0) {
    if (underPolicy === "allow")  return 1.0;
    if (underPolicy === "block")  return -999;
    if (underPolicy === "fitted") return underShoot <= 4 ? 0.8 : 0.30;
    return 0.8; // "normal"
  }

  // overShoot > 0
  const tolerance = fabric === "stretch" ? 4 : fabric === "semi" ? 2 : 0;
  if (overShoot > tolerance) return -999;
  if (overShoot <= 2)        return 0.7;
  if (overShoot <= 5)        return 0.3;
  return -999;
}

function detectBodyShape(bust: number, waist: number, hip: number): BodyShape {
  if (hip > bust + 5)                                  return "pear";
  if (waist > hip - 7)                                 return "apple";
  if (Math.abs(bust - hip) <= 5 && hip - waist >= 20) return "hourglass";
  return "rectangle";
}

function toConfidence(score: number): number {
  return Math.max(30, Math.min(99, Math.round(score * 100)));
}

function applyPreference(
  scores:  number[],
  bestIdx: number,
  pref:    Preference,
  rows:    SizeRow[]
): number {
  if (pref === "loose" && bestIdx + 1 < rows.length && scores[bestIdx + 1] >= 0.65) {
    return bestIdx + 1;
  }
  if (pref === "slim" && bestIdx - 1 >= 0 && scores[bestIdx - 1] >= 0.70) {
    return bestIdx - 1;
  }
  return bestIdx;
}

// ── Logic A: long_clothing (abaya / jalabiya) ──────────────────────────────────

function scoreLogicA(
  row:             SizeRow,
  height:          number,
  bust:            number,
  waist:           number,
  hip:             number,
  shoulder_offset: number,
  fabric:          FabricType
): number {
  const targetLength = height * 0.86;
  const targetChest  = bust + shoulder_offset;

  const lengthScore = scoreRange(targetLength, row.length_min, row.length_max, fabric);
  const chestScore  = scoreRange(targetChest,  row.bust_min,   row.bust_max,   fabric);
  const hipScore    = scoreRange(hip,          row.hip_min,    row.hip_max,    fabric);
  const waistScore  = scoreRange(waist,        row.waist_min,  row.waist_max,  fabric);

  if (lengthScore === -999 || chestScore === -999 || hipScore === -999 || waistScore === -999) {
    return -999;
  }

  let total = lengthScore * 0.50 + chestScore * 0.35 + hipScore * 0.10 + waistScore * 0.05;

  // Loose-length penalty: penalise only garments whose minimum length exceeds target
  const overLength = Math.max(0, row.length_min - targetLength);
  const lengthPenalty = overLength === 0 ? 1.0 : overLength <= 15 ? 0.9 : 0.5;
  total *= lengthPenalty;

  return total;
}

// ── Logic B: dress ─────────────────────────────────────────────────────────────

function scoreLogicB(
  row:    SizeRow,
  height: number,
  bust:   number,
  waist:  number,
  hip:    number,
  fabric: FabricType
): number {
  const targetWaist  = waist + 2;
  const targetChest  = bust  + 3;
  const targetHip    = hip   + 2;
  const targetLength = height * 0.90;

  const under: UnderPolicy =
    fabric === "stretch" ? "allow" :
    fabric === "rigid"   ? "block" :
    "fitted";

  const waistScore  = scoreRange(targetWaist,  row.waist_min,  row.waist_max,  fabric, under);
  const chestScore  = scoreRange(targetChest,  row.bust_min,   row.bust_max,   fabric, under);
  const hipScore    = scoreRange(targetHip,    row.hip_min,    row.hip_max,    fabric, under);
  const lengthScore = scoreRange(targetLength, row.length_min, row.length_max, fabric, "normal");

  if (waistScore === -999 || chestScore === -999 || hipScore === -999 || lengthScore === -999) {
    return -999;
  }

  return waistScore * 0.40 + chestScore * 0.30 + hipScore * 0.20 + lengthScore * 0.10;
}

// ── Logic C: t_shirt ──────────────────────────────────────────────────────────

function scoreLogicC(
  row:             SizeRow,
  height:          number,
  bust:            number,
  waist:           number,
  shoulder_offset: number,
  gender:          Gender,
  fabric:          FabricType
): number {
  const targetLength   = height * 0.41;
  const garment_length = (row.length_min + row.length_max) / 2;

  const lengthMult =
    garment_length < targetLength - 6  ? 0.50 :
    garment_length > targetLength + 10 ? 0.60 :
    1.0;

  const chestScore    = scoreRange(bust,                   row.bust_min,  row.bust_max,  fabric);
  const shoulderScore = scoreRange(bust + shoulder_offset, row.bust_min,  row.bust_max,  fabric);
  const waistScore    = scoreRange(waist,                  row.waist_min, row.waist_max, fabric);

  if (chestScore === -999 || shoulderScore === -999 || waistScore === -999) return -999;

  const baseScore = gender === "female"
    ? chestScore * 0.45 + shoulderScore * 0.40 + waistScore * 0.15
    : shoulderScore * 0.45 + chestScore * 0.40 + waistScore * 0.15;

  return baseScore * lengthMult;
}

// ── Measurement estimation from height/weight/body-shape answers ───────────────

export type MeasurementEstimate = {
  bust:            number;
  waist:           number;
  hip:             number;
  shoulder_offset: -2 | 0 | 2;
};

export function estimateMeasurements(
  height:    number,
  weight:    number,
  shoulders: string,
  belly:     string
): MeasurementEstimate {
  const bmi      = weight / ((height / 100) ** 2);
  const bmiDelta = bmi - 22;

  let bust  = Math.round(height * 0.525 + bmiDelta * 0.8);
  let waist = Math.round(height * 0.420 + bmiDelta * 1.2);
  let hip   = Math.round(height * 0.565 + bmiDelta * 0.9);

  if (belly === "flat")  { waist -= 4; hip -= 3; }
  if (belly === "large") { bust  += 2; waist += 6; hip += 4; }

  bust  = Math.max(60,  Math.min(160, bust));
  waist = Math.max(50,  Math.min(150, waist));
  hip   = Math.max(65,  Math.min(165, hip));

  const shoulder_offset: -2 | 0 | 2 =
    shoulders === "narrow" ? -2 :
    shoulders === "broad"  ?  2 : 0;

  return { bust, waist, hip, shoulder_offset };
}

// ── Main export ────────────────────────────────────────────────────────────────

export function calculateSize(input: AlgoInput): SizeResult {
  const {
    niche, gender, height, bust, waist, hip,
    shoulder_offset, preference, fabric_type, size_chart,
  } = input;

  const rows = size_chart;

  console.log(
    `[sizing] niche="${niche}" gender=${gender} h=${height}` +
    ` bust=${bust} waist=${waist} hip=${hip}` +
    ` shoulder_offset=${shoulder_offset} pref=${preference} fabric=${fabric_type}`
  );

  const body_shape = detectBodyShape(bust, waist, hip);

  if (!rows?.length) {
    console.warn("[sizing] Empty chart.");
    return { size: "", confidence: 0, alternatives: [], body_shape };
  }

  // Score every row
  const scores = rows.map(row => {
    if (niche === "long_clothing") {
      return scoreLogicA(row, height, bust, waist, hip, shoulder_offset, fabric_type);
    } else if (niche === "dress") {
      return scoreLogicB(row, height, bust, waist, hip, fabric_type);
    } else {
      return scoreLogicC(row, height, bust, waist, shoulder_offset, gender, fabric_type);
    }
  });

  console.log(
    "[sizing] scores: " +
    scores.map((s, i) => `${rows[i].size}=${s === -999 ? "❌" : s.toFixed(2)}`).join("  ")
  );

  // Find best valid row
  let bestIdx   = -1;
  let bestScore = -998;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > -999 && scores[i] > bestScore) {
      bestScore = scores[i];
      bestIdx   = i;
    }
  }

  if (bestIdx === -1) {
    console.warn("[sizing] All rows disqualified.");
    return { size: "", confidence: 0, alternatives: [], body_shape };
  }

  // Apply preference shift
  const finalIdx  = applyPreference(scores, bestIdx, preference, rows);
  const finalSize = rows[finalIdx].size;

  console.log(
    `[sizing] best=${rows[bestIdx].size}(${bestScore.toFixed(2)})` +
    ` → final=${finalSize} conf=${toConfidence(bestScore)}%`
  );

  // Alternatives: neighbours of final that are valid, max 2
  const altSet = new Set<string>();
  if (finalIdx > 0             && scores[finalIdx - 1] > -999) altSet.add(rows[finalIdx - 1].size);
  if (finalIdx < rows.length-1 && scores[finalIdx + 1] > -999) altSet.add(rows[finalIdx + 1].size);
  altSet.delete(finalSize);

  return {
    size:         finalSize,
    confidence:   toConfidence(bestScore),
    alternatives: [...altSet].slice(0, 2),
    body_shape,
  };
}
