import type { SizeRow } from "@/lib/globalSizeCharts";

export type Preference = "slim" | "regular" | "loose";

export type AlgoInput = {
  niche:      string;
  height:     number;
  weight:     number;
  shoulders:  string;
  belly:      string;
  preference: Preference;
  size_chart: SizeRow[];
};

export type SizeResult = {
  size:         string;
  status:       "ok" | "out_of_range";
  alternatives: string[];
};

function findRowIndex(rows: SizeRow[], value: number, type: "h" | "w"): number {
  for (let i = 0; i < rows.length; i++) {
    const min = type === "h" ? rows[i].height_min : rows[i].weight_min;
    const max = type === "h" ? rows[i].height_max : rows[i].weight_max;
    if (value >= min && value <= max) return i;
  }
  const firstMin = type === "h" ? rows[0].height_min : rows[0].weight_min;
  return value < firstMin ? 0 : rows.length - 1;
}

export function calculateSize(input: AlgoInput): SizeResult {
  const { niche, height, weight, shoulders, belly, preference, size_chart } = input;
  const rows = size_chart;
  if (!rows?.length) return { size: "", status: "ok", alternatives: [] };
  const last = rows.length - 1;

  const effectiveWeight = weight + (belly === "large" ? 8 : belly === "flat" ? -5 : 0);
  const hIdx = findRowIndex(rows, height, "h");
  const wIdx = findRowIndex(rows, effectiveWeight, "w");

  let finalIdx: number;
  if (niche === "t_shirt") {
    let tempIdx = wIdx;
    if (shoulders === "broad")  tempIdx = Math.min(tempIdx + 1, last);
    if (hIdx > tempIdx + 1)     tempIdx = Math.min(tempIdx + 1, last);
    finalIdx = tempIdx;
  } else {
    // Abaya Floor: never too short, never too tight
    finalIdx = Math.max(hIdx, wIdx);
  }

  if (preference === "loose" && finalIdx < last) finalIdx++;
  if (preference === "slim"  && finalIdx > 0)    finalIdx--;
  finalIdx = Math.max(0, Math.min(last, finalIdx));

  const alternatives: string[] = [];
  if (finalIdx > 0)    alternatives.push(rows[finalIdx - 1].size);
  if (finalIdx < last) alternatives.push(rows[finalIdx + 1].size);

  return { size: rows[finalIdx].size, status: "ok", alternatives };
}
