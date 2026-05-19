import { calculateSize } from "../lib/sizingAlgorithm";
import { TSHIRT_DEFAULT_CHART, FITTED_DEFAULT_CHART } from "../lib/globalSizeCharts";

interface TestCase {
  niche:    string;
  height:   number;
  weight:   number;
  katif:    string;
  sadr:     string;
  khasr:    string;
  warek:    string;
  expected: string;
}

const TESTS: TestCase[] = [
  // ── T-Shirt ──────────────────────────────────────────────────────────────
  { niche: "tshirt", height: 162, weight: 53,  katif: "wide",   sadr: "normal", khasr: "slim",   warek: "normal", expected: "XS" },
  { niche: "tshirt", height: 179, weight: 62,  katif: "wide",   sadr: "normal", khasr: "slim",   warek: "normal", expected: "S"  },
  { niche: "tshirt", height: 159, weight: 59,  katif: "slim",   sadr: "normal", khasr: "normal", warek: "normal", expected: "S"  },
  { niche: "tshirt", height: 155, weight: 63,  katif: "slim",   sadr: "normal", khasr: "big",    warek: "normal", expected: "M"  },
  // ── Fitted Dress ─────────────────────────────────────────────────────────
  { niche: "fitted", height: 160, weight: 50,  katif: "normal", sadr: "normal", khasr: "normal", warek: "normal", expected: "XS" },
  { niche: "fitted", height: 160, weight: 60,  katif: "normal", sadr: "big",    khasr: "normal", warek: "normal", expected: "L"  },
  { niche: "fitted", height: 162, weight: 52,  katif: "normal", sadr: "big",    khasr: "slim",   warek: "normal", expected: "S"  },
  { niche: "fitted", height: 170, weight: 65,  katif: "normal", sadr: "big",    khasr: "big",    warek: "big",    expected: "XL" },
];

console.log("=".repeat(65));
console.log("  QIYASI — ALGORITHM TEST");
console.log("=".repeat(65));

let passed = 0;
for (const t of TESTS) {
  const chart  = (t.niche === "tshirt" || t.niche === "t_shirt") ? TSHIRT_DEFAULT_CHART : FITTED_DEFAULT_CHART;
  const result = calculateSize({ ...t, size_chart: chart.rows });
  const ok     = result.size === t.expected;
  if (ok) passed++;
  const label  = `[${t.niche}] h=${t.height} w=${t.weight} katif=${t.katif} khasr=${t.khasr}`;
  console.log(`  ${ok ? "✅" : "❌"} ${label.padEnd(52)} → ${result.size.padEnd(4)} (exp ${t.expected})`);
}

console.log("─".repeat(65));
console.log(`  ${passed}/${TESTS.length} passed`);
console.log("=".repeat(65));
