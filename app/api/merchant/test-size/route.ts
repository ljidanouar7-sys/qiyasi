import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import OpenAI from "openai";
import {
  calculateSize,
  normalizeGarmentType,
  type SizeChart,
  type Range,
} from "@/lib/sizing-engine";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey:  process.env.GROQ_API_KEY!,
});

// Dashboard-internal only — no cross-origin widget calls
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth: session cookie ──────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

  // ── Parse body ────────────────────────────────────────────────────────────
  let tag: string, answers: Record<string, string>, lang: string, user_preference: string, debug: boolean;
  try {
    const body     = await req.json();
    tag             = body.tag;
    answers         = body.answers;
    user_preference = (body.user_preference || "regular") as string;
    debug           = body.debug === true;
    const langRaw   = (body.lang || "ar").toLowerCase();
    lang            = (langRaw.startsWith("ar") || langRaw === "arabic") ? "Arabic" : "English";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }
  if (!tag || !answers) {
    return NextResponse.json({ error: "tag and answers required" }, { status: 400, headers: CORS });
  }

  // ── Find merchant ─────────────────────────────────────────────────────────
  const { data: merchant } = await admin
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });

  // ── Fetch size chart ──────────────────────────────────────────────────────
  const { data: category } = await admin
    .from("categories")
    .select("size_chart, name, niche")
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

  // ── Scoring engine ────────────────────────────────────────────────────────
  const result = calculateSize({
    sizeChart,
    height:         Number(answers.height  || 0),
    weight:         Number(answers.weight  || 0),
    shoulders:      answers.shoulders      || "average",
    belly:          answers.belly          || "average",
    userPreference: user_preference,
    garmentType:    category.niche as string,
    lang,
    debug,
  });

  const garmentType = normalizeGarmentType(category.niche as string);

  const { recommended: sizeName, alternatives, confidence,
          explanation, disclaimer, wasLengthWarning } = result;
  const { chest, waist, hips } = result.estimatedBody;

  log("info", "size_calculated", { tag, size: sizeName, confidence, merchantId: merchant.id, lengthWarning: wasLengthWarning });

  // ── AI: reasoning text only ───────────────────────────────────────────────
  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as Range | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const reasoningPrompt =
`A merchant is testing their size recommendation tool. Write a friendly explanation of the system's decision.

CRITICAL: NEVER suggest a different size than "${sizeName}". Do NOT contradict the system.

DECISION:
- Recommended size: ${sizeName} (confidence: ${confidence}%)
- Alternatives: ${alternatives.join(", ") || "none"}
${disclaimer ? `- Note: ${disclaimer}` : ""}

ENGINE DATA:
- Estimated body: chest ${chest}cm, waist ${waist}cm, hips ${hips}cm
- ${explanation.join("; ")}

CUSTOMER (test):
- Height: ${answers.height}cm, Weight: ${answers.weight}kg
- Shoulders: ${answers.shoulders || "average"}, Belly: ${answers.belly || "average"}
- Fit preference: ${user_preference}

SIZE CHART (${category.name}):
${chartTable}

Return ONLY a JSON object in ${lang}:
{"message":"short friendly confirmation max 20 words","reasoning":"one sentence explaining the score-based selection"}`;

  const fallbackAI = {
    message: lang === "Arabic"
      ? `مقاسك المناسب هو ${sizeName}`
      : `Your recommended size is ${sizeName}`,
    reasoning: lang === "Arabic"
      ? `اخترنا ${sizeName} بناءً على مقاساتك المقدّرة: صدر ${chest}سم، خصر ${waist}سم.`
      : `Size ${sizeName} scored highest for estimated measurements: chest ${chest}cm, waist ${waist}cm.`,
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
      const rawResp   = (completion.choices[0].message.content ?? "").trim();
      const match     = rawResp.match(/\{[\s\S]*\}/);
      const candidate = JSON.parse(match?.[0] || rawResp);
      if (candidate.message && candidate.reasoning) parsedAI = candidate;
    } catch (aiErr) {
      log("error", "ai_reasoning_failed", { tag, error: String(aiErr) });
    }
  }

  return NextResponse.json({
    size:         sizeName,
    status:       "available",
    confidence,
    alternatives,
    message:      parsedAI.message,
    reasoning:    parsedAI.reasoning,
    disclaimer:   disclaimer ?? undefined,
    garmentType:  result.garmentType,
    heightFactor: result.heightFactor,
    ...(debug && result.debug ? { debug: result.debug } : {}),
  }, { headers: CORS });
}
