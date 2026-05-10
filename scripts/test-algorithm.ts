/**
 * Local algorithm test — no DB needed.
 * Tests calculateSize() with the new measurement-based input format.
 */

import { calculateSize } from "../lib/sizingAlgorithm";
import type { AlgoInput } from "../lib/sizingAlgorithm";
import { LONG_CLOTHING_DEFAULT_CHART, T_SHIRT_DEFAULT_CHART } from "../lib/globalSizeCharts";

interface TestCase {
  label:           string;
  height:          number;
  bust:            number;
  waist:           number;
  hip:             number;
  shoulder_offset: -2 | 0 | 2;
  expected?:       string;
}

const TEST_CASES: TestCase[] = [
  { label: "XS — صغيرة جداً",        height: 150, bust: 80,  waist: 62,  hip: 86,  shoulder_offset:  0, expected: "XS"  },
  { label: "S  — صغيرة",             height: 158, bust: 87,  waist: 68,  hip: 93,  shoulder_offset:  0, expected: "S"   },
  { label: "M  — متوسطة",            height: 165, bust: 93,  waist: 75,  hip: 99,  shoulder_offset:  0, expected: "M"   },
  { label: "L  — كبيرة",             height: 172, bust: 100, waist: 82,  hip: 106, shoulder_offset:  0, expected: "L"   },
  { label: "XL — كبيرة جداً",        height: 178, bust: 107, waist: 89,  hip: 113, shoulder_offset:  0, expected: "XL"  },
  { label: "XXL — ضخمة",             height: 185, bust: 115, waist: 97,  hip: 121, shoulder_offset:  0, expected: "XXL" },
  { label: "كتف عريض +2",            height: 165, bust: 90,  waist: 72,  hip: 96,  shoulder_offset: +2, expected: "M"   },
  { label: "كتف ضيق -2",             height: 165, bust: 90,  waist: 72,  hip: 96,  shoulder_offset: -2, expected: "M"   },
  { label: "خصر ضيق / ورك واسع",     height: 163, bust: 88,  waist: 62,  hip: 100, shoulder_offset:  0 },
  { label: "جسم تفاحة (خصر = ورك)",  height: 168, bust: 95,  waist: 88,  hip: 95,  shoulder_offset:  0 },
];

function badge(conf: number) {
  return conf >= 90 ? "🟢" : conf >= 70 ? "🟡" : conf > 0 ? "🔴" : "⬛";
}

function runNiche(
  nicheLabel: string,
  niche: string,
  chart: typeof LONG_CLOTHING_DEFAULT_CHART,
  gender: "female" | "male" = "female",
  fabric: "stretch" | "semi" | "rigid" = "semi",
) {
  console.log(`\n${"─".repeat(72)}`);
  console.log(`  NICHE: ${nicheLabel}  (${niche})  fabric=${fabric}`);
  console.log(`${"─".repeat(72)}`);
  console.log(`  ${"الوصف".padEnd(28)} مقاس  ثقة   بدائل         شكل`);
  console.log(`  ${"─".repeat(68)}`);

  for (const tc of TEST_CASES) {
    const input: AlgoInput = {
      niche,
      gender,
      height:          tc.height,
      bust:            tc.bust,
      waist:           tc.waist,
      hip:             tc.hip,
      shoulder_offset: tc.shoulder_offset,
      preference:      "regular",
      fabric_type:     fabric,
      size_chart:      chart.rows,
    };
    const r   = calculateSize(input);
    const alt = r.alternatives.length ? r.alternatives.join(", ") : "—";
    const ok  = tc.expected ? (r.size === tc.expected ? "✅" : `❌(exp ${tc.expected})`) : "";
    console.log(
      `  ${badge(r.confidence)} ${tc.label.padEnd(26)} ` +
      `${(r.size || "—").padEnd(6)}${String(r.confidence).padEnd(6)}` +
      `${alt.padEnd(14)} ${r.body_shape}  ${ok}`
    );
  }
}

console.log("=".repeat(72));
console.log("  QIYASI — MEASUREMENT-BASED ALGORITHM AUDIT");
console.log("=".repeat(72));

const origLog  = console.log;
const origWarn = console.warn;
console.log  = (...args: unknown[]) => { if (!String(args[0]).startsWith("[sizing]")) origLog(...args); };
console.warn = (...args: unknown[]) => { if (!String(args[0]).startsWith("[sizing]")) origWarn(...args); };

runNiche("ملابس طويلة — stretch",  "long_clothing", LONG_CLOTHING_DEFAULT_CHART, "female", "stretch");
runNiche("ملابس طويلة — semi",     "long_clothing", LONG_CLOTHING_DEFAULT_CHART, "female", "semi");
runNiche("تيشيرت — semi",          "t_shirt",       T_SHIRT_DEFAULT_CHART,       "female", "semi");

console.log = origLog;
console.warn = origWarn;

// ── Edge: empty chart
console.log("\n" + "─".repeat(72));
console.log("  TEST: جدول فارغ");
const emptyResult = calculateSize({
  niche: "t_shirt", gender: "female", height: 165,
  bust: 90, waist: 72, hip: 96, shoulder_offset: 0,
  preference: "regular", fabric_type: "semi", size_chart: [],
});
console.log(`  النتيجة: size="${emptyResult.size}" confidence=${emptyResult.confidence}`);
console.log(`  ${emptyResult.size === "" && emptyResult.confidence === 0 ? "✅ صحيح" : "❌ خطأ"}`);

console.log("\n" + "=".repeat(72));
console.log("  DONE");
console.log("=".repeat(72));
