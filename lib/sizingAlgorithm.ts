import type { SizeChart } from "./globalSizeCharts";

export type SizeResult = {
  size:         string;
  confidence:   number;
  alternatives: string[];
};

// Niches where height governs (80% height, 20% weight)
const LONG_NICHES = new Set(["long_clothing", "abaya", "jelaba"]);

// Continuous fit score: 1.0 inside [min,max], linear decay outside (-0.2 per 10 units gap).
// Returns 0 when the row has no data for this field (min and max both absent/zero).
function rangeScore(value: number, min: number, max: number): number {
  if (!min && !max) return 0;
  if (value >= min && value <= max) return 1.0;
  const dist = value < min ? min - value : value - max;
  return Math.max(0, 1 - (dist / 10) * 0.2);
}

// Detect old-format charts (stored with column/range objects instead of flat numbers)
function isOldFormat(chart: SizeChart): boolean {
  if (!chart?.rows?.length) return false;
  const first = chart.rows[0] as Record<string, unknown>;
  return !("height_min" in first) && !("weight_min" in first);
}

export function calculateSize(
  niche:     string,
  height:    number,
  weight:    number,
  chart:     SizeChart
): SizeResult {
  // ── Input normalisation (round to avoid float noise near boundaries) ────────
  const h = Math.round(height);
  const w = Math.round(weight);

  console.log(`[sizing] Niche detected: "${niche}" | isLong: ${LONG_NICHES.has(niche)} | h=${h} w=${w}`);

  // ── Guard: old-format chart ─────────────────────────────────────────────────
  if (isOldFormat(chart)) {
    console.warn("[sizing] Old-format size chart detected (column-range schema). Re-save the category to use the new format.");
    return { size: "", confidence: 0, alternatives: [] };
  }

  const rows = chart.rows;
  if (!rows?.length) {
    console.warn("[sizing] Empty size chart.");
    return { size: "", confidence: 0, alternatives: [] };
  }

  const isLong = LONG_NICHES.has(niche);

  // ── Score every row ─────────────────────────────────────────────────────────
  const scored = rows.map((row, rowIdx) => {
    const hScore = rangeScore(h, row.height_min ?? 0, row.height_max ?? 0);
    const wScore = rangeScore(w, row.weight_min ?? 0, row.weight_max ?? 0);
    const total  = isLong
      ? 0.80 * hScore + 0.20 * wScore   // long clothing: height is decisive
      : 0.30 * hScore + 0.70 * wScore;  // t-shirt: weight is decisive
    console.log(`[sizing]   row[${rowIdx}] ${row.size}: hScore=${hScore.toFixed(3)} wScore=${wScore.toFixed(3)} total=${total.toFixed(3)}`);
    return { row, rowIdx, total };
  });

  // ── Sort: descending score; tiebreak by rowIdx (preserve chart order) ───────
  scored.sort((a, b) => b.total - a.total || a.rowIdx - b.rowIdx);
  const best = scored[0];

  console.log(`[sizing] Baseline winner: "${best.row.size}" (score=${best.total.toFixed(3)})`);
  console.log(`[sizing] Final size: "${best.row.size}"`);

  const confidence   = Math.min(99, Math.round(best.total * 100));
  const alternatives = scored
    .slice(1, 3)
    .filter(s => s.total > 0.1)
    .map(s => s.row.size);

  return {
    size:         best.row.size,
    confidence,
    alternatives,
  };
}
