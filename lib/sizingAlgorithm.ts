import type { SizeChart } from "./globalSizeCharts";

export type SizeResult = {
  size:         string;
  confidence:   number;
  alternatives: string[];
};

// Continuous fit score: 1.0 if value is in [min,max], decays linearly outside (-0.2 per 10 units)
function rangeScore(value: number, min: number, max: number): number {
  if (!min && !max) return 0;  // row has no data for this field
  if (value >= min && value <= max) return 1.0;
  const dist = value < min ? min - value : value - max;
  return Math.max(0, 1 - (dist / 10) * 0.2);
}

// Niches where height governs (80% height, 20% weight)
const LONG_NICHES = new Set(["long_clothing", "abaya", "jelaba"]);

export function calculateSize(
  niche:     string,
  height:    number,
  weight:    number,
  sizeChart: SizeChart
): SizeResult {
  const rows = sizeChart.rows;
  if (rows.length === 0) return { size: "", confidence: 0, alternatives: [] };

  const isLong = LONG_NICHES.has(niche);

  // Score every row with niche-specific weights
  const scored = rows.map((row, rowIdx) => {
    const hScore = rangeScore(height, row.height_min ?? 0, row.height_max ?? 0);
    const wScore = rangeScore(weight, row.weight_min ?? 0, row.weight_max ?? 0);
    const total  = isLong
      ? 0.80 * hScore + 0.20 * wScore   // long clothing: height is decisive
      : 0.30 * hScore + 0.70 * wScore;  // t-shirt: weight is decisive
    return { row, rowIdx, total };
  });

  scored.sort((a, b) => b.total - a.total);
  const best = scored[0];

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
