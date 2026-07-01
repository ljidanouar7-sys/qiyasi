import type { SizeRow } from "@/lib/globalSizeCharts";

export type AlgoInput = {
  niche:      string;
  height:     number;
  weight:     number;
  katif:      string;
  sadr:       string;
  khasr:      string;
  warek:      string;
  size_chart: SizeRow[];
  bias?:      number; // تصحيح تلقائي مكتسب من فيدباك الزبائن (موجب = مقاس أكبر، سالب = أصغر)
};

function clampIdx(idx: number, last: number): number {
  return Math.min(Math.max(idx, 0), last);
}

export type SizeResult = {
  size:         string;
  status:       "ok" | "out_of_range";
  alternatives: string[];
  decided_by?:  string;
};

// ─── Algorithm A: T-Shirt ────────────────────────────────────────────────────

function getTshirtSize(
  rows: SizeRow[], height: number, weight: number,
  katif: string, khasr: string, bias: number
): SizeResult {
  const katifAdj: Record<string, number> = { wide: 2, normal: 0, slim: -2 };
  const khsarAdj: Record<string, number> = { big: 5, normal: 0, slim: -5 };

  const chest_base  = weight * 0.45 + height * 0.22 + 27;
  const waist_base  = chest_base * 0.9;
  const chest_final = chest_base + (katifAdj[katif] ?? 0);
  const waist_final = waist_base + (khsarAdj[khasr] ?? 0);

  function findIdx(val: number, minKey: "bust_min"|"waist_min", maxKey: "bust_max"|"waist_max"): number {
    for (let i = 0; i < rows.length; i++) {
      const min = rows[i][minKey] ?? -Infinity;
      const max = rows[i][maxKey];
      if (val >= min && val < max) return i;  // min ≤ x < max — لا overlap
    }
    return rows.length - 1;  // يتجاوز الأقصى → آخر مقاس
  }

  const chestIdx = findIdx(chest_final, "bust_min", "bust_max");
  const waistIdx = findIdx(waist_final, "waist_min", "waist_max");
  const last     = rows.length - 1;
  const finalIdx = clampIdx(Math.max(chestIdx, waistIdx) + Math.round(bias), last);

  return {
    size:       rows[finalIdx].size,
    status:     "ok",
    decided_by: chestIdx >= waistIdx ? "chest" : "waist",
    alternatives: [
      ...(finalIdx > 0    ? [rows[finalIdx - 1].size] : []),
      ...(finalIdx < last ? [rows[finalIdx + 1].size] : []),
    ],
  };
}

// ─── Algorithm B: Fitted Dress ───────────────────────────────────────────────

function getFittedSize(
  rows: SizeRow[], height: number, weight: number,
  sadr: string, khasr: string, warek: string, bias: number
): SizeResult {
  const adj: Record<string, number> = { big: 1, normal: 0, slim: -1 };

  const bmi     = weight / Math.pow(height / 100, 2);
  const BMI_MIN = 15, BMI_MAX = 35;
  const ratio   = Math.min(Math.max((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN), 0), 1);
  const baseIdx = Math.min(Math.max(Math.round(ratio * (rows.length - 1)), 0), rows.length - 1);

  const weighted = (adj[sadr]  ?? 0) * 0.6
                 + (adj[khasr] ?? 0) * 0.6
                 + (adj[warek] ?? 0) * 0.5;

  const last     = rows.length - 1;
  const finalIdx = clampIdx(Math.round(baseIdx + weighted) + Math.round(bias), last);

  return {
    size:   rows[finalIdx].size,
    status: "ok",
    alternatives: [
      ...(finalIdx > 0    ? [rows[finalIdx - 1].size] : []),
      ...(finalIdx < last ? [rows[finalIdx + 1].size] : []),
    ],
  };
}

// ─── Algorithm C: Abaya / Long Dress ────────────────────────────────────────

function getAbayaSize(
  rows: SizeRow[], height: number, weight: number,
  sadr: string, warek: string, bias: number
): SizeResult {
  const adj: Record<string, number> = { big: 1, normal: 0, slim: -1 };

  const bmi     = weight / Math.pow(height / 100, 2);
  const BMI_MIN = 15, BMI_MAX = 35;
  const ratio   = Math.min(Math.max((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN), 0), 1);
  const baseIdx = Math.min(Math.max(Math.round(ratio * (rows.length - 1)), 0), rows.length - 1);

  const weighted = (adj[sadr]  ?? 0) * 0.7
                 + (adj[warek] ?? 0) * 0.3;

  const last     = rows.length - 1;
  const finalIdx = clampIdx(Math.round(baseIdx + weighted) + Math.round(bias), last);

  return {
    size: rows[finalIdx].size,
    status: "ok",
    alternatives: [
      ...(finalIdx > 0    ? [rows[finalIdx - 1].size] : []),
      ...(finalIdx < last ? [rows[finalIdx + 1].size] : []),
    ],
  };
}

// ─── Algorithm D: Thobe / Jelaba ────────────────────────────────────────────

function getThobeSize(
  rows: SizeRow[], height: number, weight: number,
  katif: string, sadr: string, bias: number
): SizeResult {
  const adj: Record<string, number> = { wide: 1, big: 1, normal: 0, slim: -1 };

  const bmi     = weight / Math.pow(height / 100, 2);
  const BMI_MIN = 15, BMI_MAX = 35;
  const ratio   = Math.min(Math.max((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN), 0), 1);
  const baseIdx = Math.min(Math.max(Math.round(ratio * (rows.length - 1)), 0), rows.length - 1);

  const weighted = (adj[katif] ?? 0) * 0.6
                 + (adj[sadr]  ?? 0) * 0.4;

  const last     = rows.length - 1;
  const finalIdx = clampIdx(Math.round(baseIdx + weighted) + Math.round(bias), last);

  return {
    size: rows[finalIdx].size,
    status: "ok",
    alternatives: [
      ...(finalIdx > 0    ? [rows[finalIdx - 1].size] : []),
      ...(finalIdx < last ? [rows[finalIdx + 1].size] : []),
    ],
  };
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export function calculateSize(input: AlgoInput): SizeResult {
  const { height, weight, katif, sadr, khasr, warek, bias = 0 } = input;

  // نرتب تصاعدياً حسب bust_min قبل أي حساب — باش fallback آخر مقاس يكون صحيح دائماً
  const size_chart = [...input.size_chart].sort((a, b) => (a.bust_min ?? 0) - (b.bust_min ?? 0));

  if (!size_chart.length) return { size: "", status: "ok", alternatives: [] };

  const niche =
    input.niche === "t_shirt"       ? "tshirt" :
    input.niche === "long_clothing" ? "abaya"  :
    input.niche === "dress"         ? "fitted" :
    input.niche === "jelaba"        ? "thobe"  :
    input.niche;

  if (niche === "tshirt") return getTshirtSize(size_chart, height, weight, katif, khasr, bias);
  if (niche === "abaya")  return getAbayaSize(size_chart, height, weight, sadr, warek, bias);
  if (niche === "thobe")  return getThobeSize(size_chart, height, weight, katif, sadr, bias);
  return getFittedSize(size_chart, height, weight, sadr, khasr, warek, bias);
}
