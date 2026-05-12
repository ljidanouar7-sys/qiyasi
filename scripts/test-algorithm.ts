/**
 * Local algorithm test — no DB needed.
 * Tests calculateSize() with the new height/weight-based input format.
 */

import { calculateSize } from "../lib/sizingAlgorithm";
import type { AlgoInput } from "../lib/sizingAlgorithm";
import { ABAYA_DEFAULT_CHART, T_SHIRT_DEFAULT_CHART } from "../lib/globalSizeCharts";

interface TestCase {
  label:     string;
  height:    number;
  weight:    number;
  shoulders: "narrow" | "normal" | "broad";
  belly:     "flat" | "average" | "large";
  expected?: string;
}

const ABAYA_CASES: TestCase[] = [
  { label: "XS — قصيرة خفيفة",        height: 150, weight: 50,  shoulders: "normal", belly: "average", expected: "XS"  },
  { label: "S  — S بطول",              height: 158, weight: 60,  shoulders: "normal", belly: "average", expected: "S"   },
  { label: "M  — متوسطة",             height: 165, weight: 72,  shoulders: "normal", belly: "average", expected: "M"   },
  { label: "L  — كبيرة",              height: 173, weight: 84,  shoulders: "normal", belly: "average", expected: "L"   },
  { label: "XL — كبيرة جداً",         height: 181, weight: 96,  shoulders: "normal", belly: "average", expected: "XL"  },
  { label: "XXL — ضخمة",              height: 188, weight: 108, shoulders: "normal", belly: "average", expected: "XXL" },
  { label: "بطن كبير → يرتفع",        height: 163, weight: 67,  shoulders: "normal", belly: "large",   expected: "L"   },
  { label: "بطن مسطح → يبقى",         height: 163, weight: 70,  shoulders: "normal", belly: "flat",    expected: "M"   },
  { label: "طول L وزن M → L (Floor)", height: 173, weight: 70,  shoulders: "normal", belly: "average", expected: "L"   },
];

const TSHIRT_CASES: TestCase[] = [
  { label: "XS تيشيرت",               height: 150, weight: 50,  shoulders: "normal", belly: "average", expected: "XS"  },
  { label: "M تيشيرت",                height: 165, weight: 72,  shoulders: "normal", belly: "average", expected: "M"   },
  { label: "كتف عريض → L",            height: 165, weight: 72,  shoulders: "broad",  belly: "average", expected: "L"   },
  { label: "طول يرتفع الى L",         height: 178, weight: 70,  shoulders: "normal", belly: "average", expected: "L"   },
];

function runTests(label: string, niche: string, cases: TestCase[], chart: typeof ABAYA_DEFAULT_CHART) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`  ${label}`);
  console.log(`${"─".repeat(70)}`);

  let passed = 0, total = 0;
  for (const tc of cases) {
    const input: AlgoInput = {
      niche,
      height:     tc.height,
      weight:     tc.weight,
      shoulders:  tc.shoulders,
      belly:      tc.belly,
      preference: "regular",
      size_chart: chart.rows,
    };
    const r   = calculateSize(input);
    const alt = r.alternatives.length ? r.alternatives.join(", ") : "—";
    const ok  = tc.expected ? (r.size === tc.expected ? "✅" : `❌(exp ${tc.expected})`) : "";
    if (tc.expected) { total++; if (r.size === tc.expected) passed++; }
    console.log(
      `  ${tc.label.padEnd(28)} → ${(r.size || "—").padEnd(5)}  alts: ${alt.padEnd(10)} ${ok}`
    );
  }
  if (total > 0) console.log(`\n  النتيجة: ${passed}/${total} ✅`);
}

console.log("=".repeat(70));
console.log("  QIYASI — HEIGHT/WEIGHT ALGORITHM AUDIT");
console.log("=".repeat(70));

runTests("عبايات / ملابس طويلة", "long_clothing", ABAYA_CASES,  ABAYA_DEFAULT_CHART);
runTests("تيشيرت",               "t_shirt",        TSHIRT_CASES, T_SHIRT_DEFAULT_CHART);

// ── Edge: empty chart
console.log(`\n${"─".repeat(70)}`);
console.log("  TEST: جدول فارغ");
const emptyResult = calculateSize({
  niche: "t_shirt", height: 165, weight: 70,
  shoulders: "normal", belly: "average",
  preference: "regular", size_chart: [],
});
console.log(`  النتيجة: size="${emptyResult.size}" status=${emptyResult.status}`);
console.log(`  ${emptyResult.size === "" ? "✅ صحيح" : "❌ خطأ"}`);

console.log("\n" + "=".repeat(70));
console.log("  DONE");
console.log("=".repeat(70));
