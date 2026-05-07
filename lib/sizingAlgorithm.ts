import type { SizeChart } from "./globalSizeCharts";

export type Modifiers = {
  shoulders?:      string;  // "wide"|"broad" → +1 | "narrow" → -1 | "average" → 0
  belly?:          string;  // "big"|"prominent" → +1 | "flat"|"average" → 0
  userPreference?: string;  // "loose"|"oversized" → +1 | "fitted"|"slim" → -1 | "regular" → 0
};

export type SizeResult = {
  size:         string;
  confidence:   number;
  alternatives: string[];
  reasoning:    string;    // for logging/API — not displayed in the widget
};

function isOldFormat(chart: SizeChart): boolean {
  if (!chart?.rows?.length) return false;
  const first = chart.rows[0] as Record<string, unknown>;
  return !("height_min" in first) && !("weight_min" in first);
}

// Finds which row a value belongs to.
// Uses [min, max) — exclusive upper bound — for all rows except the last (which uses <=).
// This way a boundary value (e.g. 163 cm) always goes to the UPPER size, not the lower.
// Returns 0 if below the first row, last index if above the last row.
function findRowIdx(
  rows:   SizeChart["rows"],
  minKey: "height_min" | "weight_min",
  maxKey: "height_max" | "weight_max",
  value:  number
): number {
  for (let i = 0; i < rows.length - 1; i++) {
    const min = (rows[i][minKey] as number) ?? 0;
    const max = (rows[i][maxKey] as number) ?? 0;
    if (value >= min && value < max) return i;
  }
  const last    = rows[rows.length - 1];
  const lastMin = (last[minKey] as number) ?? 0;
  const lastMax = (last[maxKey] as number) ?? Infinity;
  if (value >= lastMin && value <= lastMax) return rows.length - 1;
  // Outside all ranges — clamp
  return value < ((rows[0][minKey] as number) ?? 0) ? 0 : rows.length - 1;
}

export function calculateSize(
  niche:  string,
  height: number,
  weight: number,
  chart:  SizeChart,
  mods:   Modifiers = {}
): SizeResult {
  const h = Math.round(height);
  const w = Math.round(weight);

  console.log(`[sizing] niche="${niche}" h=${h} w=${w} mods=${JSON.stringify(mods)}`);

  if (isOldFormat(chart)) {
    console.warn("[sizing] Old-format chart — re-save to use new format.");
    return { size: "", confidence: 0, alternatives: [], reasoning: "" };
  }

  const rows = chart.rows;
  if (!rows?.length) {
    console.warn("[sizing] Empty chart.");
    return { size: "", confidence: 0, alternatives: [], reasoning: "" };
  }

  // ── Step A: independent lookups ─────────────────────────────────────────────
  const hIdx = findRowIdx(rows, "height_min", "height_max", h);
  const wIdx = findRowIdx(rows, "weight_min", "weight_max", w);

  console.log(`[sizing] sizeByHeight="${rows[hIdx].size}" (idx=${hIdx})  sizeByWeight="${rows[wIdx].size}" (idx=${wIdx})`);

  // ── Step B: base index ────────────────────────────────────────────────────────
  // Normal gap (≤2): take max — satisfies the binding dimension.
  // Outlier gap (>2): compromise at ceil((hIdx+wIdx)/2) to avoid over-sizing
  // a tall-slim or short-heavy body (e.g. h=195 w=65 → XXL would be a tent).
  const gap     = Math.abs(hIdx - wIdx);
  const baseIdx = gap > 2
    ? Math.ceil((hIdx + wIdx) / 2)
    : Math.max(hIdx, wIdx);
  const baseSize = rows[baseIdx].size;

  // ── Step C: body modifiers ──────────────────────────────────────────────────
  let offset = 0;
  const reasons: string[] = [];
  const { shoulders, belly, userPreference } = mods;

  // Girth modifier: shoulders + belly are grouped and capped at +1 combined
  // (prevents the "tent" effect when both are prominent).
  const broadShoulders = shoulders === "wide" || shoulders === "broad";
  const prominentBelly = belly === "big" || belly === "prominent";
  const narrowShoulders = shoulders === "narrow";

  if (broadShoulders || prominentBelly) {
    offset += 1;
    const girthReasons: string[] = [];
    if (broadShoulders) girthReasons.push("كتفيك العريضة");
    if (prominentBelly) girthReasons.push("حجم البطن");
    reasons.push(`${girthReasons.join(" و")} رفعا المقاس`);
  } else if (narrowShoulders) {
    offset -= 1;
    reasons.push("كتفيك الضيقة خفضت المقاس");
  }

  // Preference modifier — independent of girth
  if (userPreference === "loose" || userPreference === "oversized") {
    offset += 1;
    reasons.push("تفضيلك للمقاس الواسع رفعه");
  } else if (userPreference === "fitted" || userPreference === "slim") {
    offset -= 1;
    reasons.push("تفضيلك للمقاس الضيق خفضه");
  }

  // ── Step D: clamp final index to available sizes ────────────────────────────
  const finalIdx  = Math.min(rows.length - 1, Math.max(0, baseIdx + offset));
  const finalSize = rows[finalIdx].size;

  console.log(`[sizing] baseIdx=${baseIdx} offset=${offset >= 0 ? "+" : ""}${offset} finalIdx=${finalIdx} → "${finalSize}"`);

  // ── Confidence ──────────────────────────────────────────────────────────────
  // Agreement = how far height and weight diverge in size index
  const agreement  = Math.abs(hIdx - wIdx);
  const baseConf   = agreement === 0 ? 95 : agreement === 1 ? 80 : agreement === 2 ? 65 : 50;
  const modPenalty = Math.abs(offset) * 8;
  const confidence = Math.max(30, Math.min(99, baseConf - modPenalty));

  // ── Alternatives ────────────────────────────────────────────────────────────
  const altSet = new Set<string>();
  if (finalIdx > 0)               altSet.add(rows[finalIdx - 1].size);
  if (finalIdx < rows.length - 1) altSet.add(rows[finalIdx + 1].size);
  if (finalIdx !== baseIdx)       altSet.add(rows[baseIdx].size);
  altSet.delete(finalSize);
  const alternatives = [...altSet].slice(0, 2);

  // ── Reasoning (API/logging only — not shown in widget) ──────────────────────
  let baseReason: string;
  if (hIdx === wIdx) {
    baseReason = `طولك ووزنك يتفقان على مقاس ${baseSize}`;
  } else if (gap > 2) {
    baseReason = `طولك يقترح ${rows[hIdx].size} ووزنك يقترح ${rows[wIdx].size} — الفرق كبير فاعتمدنا مقاساً وسطاً ${baseSize}`;
  } else if (hIdx > wIdx) {
    baseReason = `طولك يستوجب ${rows[hIdx].size} بينما وزنك يقترح ${rows[wIdx].size} — اعتمدنا ${baseSize} لضمان الطول الكافي`;
  } else {
    baseReason = `وزنك يستوجب ${rows[wIdx].size} بينما طولك يقترح ${rows[hIdx].size} — اعتمدنا ${baseSize} لضمان الراحة`;
  }
  const reasoning = reasons.length > 0
    ? `${baseReason}. ${reasons.join("، ")}.`
    : `${baseReason}.`;

  console.log(`[sizing] conf=${confidence}% reasoning="${reasoning}"`);

  return { size: finalSize, confidence, alternatives, reasoning };
}
