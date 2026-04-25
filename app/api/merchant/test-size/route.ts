import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import OpenAI from "openai";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey:  process.env.GROQ_API_KEY!,
});

// ── Types ──────────────────────────────────────────────────
type SizeChartColumn = { id: string; label: string; quiz_field: string };
type SizeChartRow    = Record<string, unknown>;
type SizeChart       = { columns: SizeChartColumn[]; rows: SizeChartRow[] };
type Range           = { min: number; max: number };

// ── CORS (dashboard-internal, but defined for consistency) ─
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Sizing helpers ─────────────────────────────────────────

function findSizeIndex(rows: SizeChartRow[], colId: string, value: number): number {
  return rows.findIndex(row => {
    const range = row[colId] as Range | undefined;
    if (!range) return false;
    if (value < range.min || value > range.max) return false;
    // Top 5% of the span → push up (e.g. height=170 in M[163-170] → goes to L)
    const span = range.max - range.min;
    if (span > 0 && (value - range.min) / span >= 0.95) return false;
    return true;
  });
}

function isUpperHalf(value: number, range: Range): boolean {
  return value >= (range.min + range.max) / 2;
}

function findColumnId(columns: SizeChartColumn[], ...ids: string[]): string | null {
  for (const id of ids) {
    if (columns.some(c => c.id === id)) return id;
  }
  return null;
}

function calculateSizeDeterministic(params: {
  sizeChart:      SizeChart;
  height:         number;
  weight:         number;
  shoulders:      string;
  belly:          string;
  fitType:        string;
  userPreference: string;
  lang:           string;
}): { sizeName: string; adjustments: string[]; disclaimer: string | null } {
  const { sizeChart, height, weight, shoulders, belly, fitType, userPreference, lang } = params;
  const { rows, columns } = sizeChart;
  const adjustments: string[] = [];

  // ── Rule 1: Abaya Floor ──────────────────────────────────
  let i_h = findSizeIndex(rows, "h", height);
  let i_w = findSizeIndex(rows, "w", weight);

  if (i_h < 0) {
    const lastH = rows[rows.length - 1]?.h as Range | undefined;
    i_h = (lastH && height > lastH.max) ? rows.length - 1 : 0;
  }
  if (i_w < 0) {
    const lastW = rows[rows.length - 1]?.w as Range | undefined;
    i_w = (lastW && weight > lastW.max) ? rows.length - 1 : 0;
  }

  let idx = Math.max(i_h, i_w);

  // ── Rule 2: Body shape offsets ───────────────────────────
  const chestColId = findColumnId(columns, "ch") ?? "w";
  const chestRange = rows[idx]?.[chestColId] as Range | undefined;
  if (shoulders === "wide" && chestRange && isUpperHalf(weight, chestRange)) {
    idx = Math.min(idx + 1, rows.length - 1);
    adjustments.push("broad shoulders (+4 cm shoulder offset)");
  }

  const waistColId = findColumnId(columns, "wa", "hi") ?? "w";
  const waistRange = rows[idx]?.[waistColId] as Range | undefined;
  if (belly === "big" && waistRange && isUpperHalf(weight, waistRange)) {
    idx = Math.min(idx + 1, rows.length - 1);
    adjustments.push("protruding abdomen (+7 cm waist offset)");
  }

  const narrowColId = findColumnId(columns, "ch") ?? "w";
  const narrowRange = rows[idx]?.[narrowColId] as Range | undefined;
  if (shoulders === "narrow" && belly === "flat" && narrowRange && !isUpperHalf(weight, narrowRange)) {
    idx = Math.max(idx - 1, 0);
    adjustments.push("narrow build");
  }

  // ── Rule 3: Fit Type × User Preference ──────────────────
  let disclaimer: string | null = null;
  if (fitType === "slim" && userPreference === "loose") {
    idx = Math.min(idx + 1, rows.length - 1);
    adjustments.push("loose preference on slim-cut design");
  }
  if (fitType === "oversized" && userPreference === "fitted") {
    disclaimer = lang === "Arabic"
      ? "هذا الطراز مصمم ليكون فضفاضاً بطبيعته — هذا هو المقاس المناسب"
      : "This style is intentionally oversized — this is the correct size for you.";
    adjustments.push("fitted preference on oversized style");
  }

  return { sizeName: String(rows[idx]?.size ?? ""), adjustments, disclaimer };
}

// ── POST ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Auth: session cookie ──────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

  // ── Parse body ────────────────────────────────────────────
  let tag: string, answers: Record<string, string>, lang: string, user_preference: string;
  try {
    const body     = await req.json();
    tag             = body.tag;
    answers         = body.answers;
    user_preference = (body.user_preference || "regular") as string;

    // Support 'ar', 'ar-SA', 'Arabic', 'arabic'
    const langRaw = (body.lang || "ar").toLowerCase();
    lang = (langRaw.startsWith("ar") || langRaw === "arabic") ? "Arabic" : "English";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }
  if (!tag || !answers) {
    return NextResponse.json({ error: "tag and answers required" }, { status: 400, headers: CORS });
  }

  // ── Find merchant ─────────────────────────────────────────
  const { data: merchant } = await admin
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });

  // ── Fetch size chart ──────────────────────────────────────
  const { data: category } = await admin
    .from("categories")
    .select("size_chart, name, fit_type")
    .eq("merchant_id", merchant.id)
    .ilike("tag", tag)
    .single();
  if (!category?.size_chart) {
    return NextResponse.json(
      { error: lang === "Arabic" ? `لا توجد فئة بالرمز: ${tag}` : `No category with tag: ${tag}` },
      { status: 404, headers: CORS }
    );
  }

  const sizeChart = category.size_chart as SizeChart;
  const fitType   = (category.fit_type as string) || "regular";
  console.log("[test-size] tag:", tag, "| sizes:", sizeChart.rows.map(r => r.size).join(", "));

  // ── Deterministic size calculation ────────────────────────
  const { sizeName, adjustments, disclaimer } = calculateSizeDeterministic({
    sizeChart,
    height:         Number(answers.height  || 0),
    weight:         Number(answers.weight  || 0),
    shoulders:      answers.shoulders      || "average",
    belly:          answers.belly          || "average",
    fitType,
    userPreference: user_preference,
    lang,
  });

  console.log(`[test-size] size: "${sizeName}", adjustments: [${adjustments.join(", ")}]`);

  // ── AI: reasoning text only ───────────────────────────────
  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as Range | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const reasoningPrompt = `A merchant is testing their size recommendation tool. The system already chose the size — write a friendly explanation.

DECISION:
- Chosen size: ${sizeName}
- Fit type: ${fitType}
- Adjustments applied: ${adjustments.length ? adjustments.join("; ") : "none — straight height/weight match"}
${disclaimer ? `- Note: ${disclaimer}` : ""}

CUSTOMER (test):
- Height: ${answers.height} cm, Weight: ${answers.weight} kg
- Shoulders: ${answers.shoulders || "average"}, Belly: ${answers.belly || "average"}
- Fit preference: ${user_preference}

SIZE CHART (${category.name}):
${chartTable}

Return ONLY a JSON object in ${lang}:
{"message":"short friendly confirmation max 20 words","reasoning":"one sentence explaining why this size"}`;

  // Fallback used if AI fails
  const fallbackAI = {
    message: lang === "Arabic"
      ? `مقاسك المناسب هو ${sizeName}`
      : `Your recommended size is ${sizeName}`,
    reasoning: adjustments.length
      ? (lang === "Arabic"
          ? `اخترنا ${sizeName} بسبب: ${adjustments.join("، ")}.`
          : `Size ${sizeName} selected based on: ${adjustments.join(", ")}.`)
      : (lang === "Arabic"
          ? `اخترنا ${sizeName} بناءً على طولك ووزنك.`
          : `Size ${sizeName} selected based on your height and weight.`),
  };

  let parsedAI = fallbackAI;

  if (process.env.GROQ_API_KEY) {
    try {
      const completion = await groq.chat.completions.create({
        model:       "llama-3.3-70b-versatile",
        messages:    [{ role: "user", content: reasoningPrompt }],
        temperature: 0.3,
        max_tokens:  150,
      });
      const rawResp = (completion.choices[0].message.content ?? "").trim();
      console.log("[test-size] Groq reasoning:", rawResp);
      const match     = rawResp.match(/\{[\s\S]*\}/);
      const candidate = JSON.parse(match?.[0] || rawResp);
      if (candidate.message && candidate.reasoning) parsedAI = candidate;
    } catch (aiErr) {
      console.error("[test-size] AI reasoning failed — using fallback:", aiErr);
      // parsedAI stays as fallbackAI — no crash
    }
  }

  return NextResponse.json({
    size:       sizeName,
    status:     "available",
    message:    parsedAI.message,
    reasoning:  parsedAI.reasoning,
    disclaimer: disclaimer ?? undefined,
  }, { headers: CORS });
}
