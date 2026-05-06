import type { SizeChart, SizeRow } from "./globalSizeCharts";

export type SizeResult = {
  size:         string;
  confidence:   number;
  alternatives: string[];
};

type RowMatch = {
  row:     SizeRow;
  rowIdx:  number;
  isExact: boolean;
};

function findRowByRange(
  rows:   SizeRow[],
  minKey: keyof SizeRow,
  maxKey: keyof SizeRow,
  value:  number
): RowMatch {
  // Exact range match
  for (let i = 0; i < rows.length; i++) {
    const min = rows[i][minKey] as number;
    const max = rows[i][maxKey] as number;
    if (value >= min && value <= max) {
      return { row: rows[i], rowIdx: i, isExact: true };
    }
  }
  // Closest boundary fallback
  let bestIdx  = 0;
  let bestDist = Infinity;
  for (let i = 0; i < rows.length; i++) {
    const min  = rows[i][minKey] as number;
    const max  = rows[i][maxKey] as number;
    const dist = value < min ? min - value : value - max;
    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
  }
  return { row: rows[bestIdx], rowIdx: bestIdx, isExact: false };
}

export function calculateSize(
  niche:     string,
  height:    number,
  weight:    number,
  sizeChart: SizeChart
): SizeResult {
  const rows = sizeChart.rows;
  if (rows.length === 0) return { size: "", confidence: 0, alternatives: [] };

  const heightMatch = findRowByRange(rows, "height_min", "height_max", height);
  const weightMatch = findRowByRange(rows, "weight_min", "weight_max", weight);

  // long_clothing → height is primary; t_shirt → weight is primary
  const isLong    = niche === "long_clothing";
  const primary   = isLong ? heightMatch : weightMatch;
  const secondary = isLong ? weightMatch : heightMatch;

  const agreed = primary.rowIdx === secondary.rowIdx;

  const confidence =
    primary.isExact && secondary.isExact && agreed ? 95 :
    primary.isExact && agreed                      ? 80 :
    primary.isExact                                ? 70 :
    55;

  // Build alternatives: secondary (if different) then adjacent neighbor
  const seen = new Set<string>([primary.row.size]);
  const alts: string[] = [];

  if (!agreed) {
    alts.push(secondary.row.size);
    seen.add(secondary.row.size);
  }

  // Prefer neighbor in the direction of the secondary recommendation
  const dir         = secondary.rowIdx >= primary.rowIdx ? 1 : -1;
  const neighborIdx = primary.rowIdx + dir;
  if (neighborIdx >= 0 && neighborIdx < rows.length && !seen.has(rows[neighborIdx].size)) {
    alts.push(rows[neighborIdx].size);
    seen.add(rows[neighborIdx].size);
  }
  // Fill second slot from opposite side if needed
  if (alts.length < 2) {
    const otherIdx = primary.rowIdx - dir;
    if (otherIdx >= 0 && otherIdx < rows.length && !seen.has(rows[otherIdx].size)) {
      alts.push(rows[otherIdx].size);
    }
  }

  return {
    size:         primary.row.size,
    confidence,
    alternatives: alts.slice(0, 2),
  };
}
