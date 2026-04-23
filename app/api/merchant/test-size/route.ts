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

type SizeChart = {
  columns: { id: string; label: string; quiz_field: string }[];
  rows: Record<string, unknown>[];
};

export async function POST(req: NextRequest) {
  // ── Auth: session cookie ───────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Parse body ─────────────────────────────────────────────
  let tag: string, answers: Record<string, string>;
  try {
    const body = await req.json();
    tag     = body.tag;
    answers = body.answers;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!tag || !answers) {
    return NextResponse.json({ error: "tag and answers required" }, { status: 400 });
  }

  // ── Find merchant ──────────────────────────────────────────
  const { data: merchant } = await admin
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  // ── Fetch size chart ───────────────────────────────────────
  const { data: category } = await admin
    .from("categories")
    .select("size_chart, name")
    .eq("merchant_id", merchant.id)
    .ilike("tag", tag)
    .single();
  if (!category?.size_chart) {
    return NextResponse.json({ error: `لا توجد فئة بالرمز: ${tag}` }, { status: 404 });
  }

  const sizeChart  = category.size_chart as SizeChart;
  const validSizes = sizeChart.rows.map(r => String(r.size));
  console.log("[test-size] tag:", tag, "| validSizes:", validSizes);

  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as { min: number; max: number } | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  // ── AI (Gemma 2 9B via Groq) ───────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const shouldersMap: Record<string, string> = { wide: "wide", average: "average", narrow: "narrow" };
  const legsMap: Record<string, string>      = { long: "long", average: "average", short: "short" };
  const bellyMap: Record<string, string>     = { flat: "flat", average: "average", big: "big" };

  const systemInstruction = `You are a professional tailor specializing in abayas and djellabas.
Rules:
1. Priority to WIDTH (weight) over height — if weight suggests a larger size, choose larger.
2. When between two sizes, ALWAYS size up.
3. stock_info not provided — set status "available" always.
4. Output ONLY a JSON object. No markdown, no extra text.`;

  const prompt = `VALID SIZES (copy one exactly):
${validSizes.map(s => `"${s}"`).join(" | ")}

CUSTOMER MEASUREMENTS:
- Height: ${answers.height} cm
- Weight: ${answers.weight} kg
- Shoulders: ${shouldersMap[answers.shoulders] || answers.shoulders}
- Legs: ${legsMap[answers.legs] || answers.legs}
- Belly: ${bellyMap[answers.belly] || answers.belly}

SIZE CHART (${category.name}):
${chartTable}

OUTPUT (strict JSON only):
{"recommendedSize":"exact size from chart","status":"available","message":"short user-friendly message in Arabic"}`;

  let rawResp: string;
  try {
    const completion = await groq.chat.completions.create({
      model:       "gemma2-9b-it",
      messages:    [
        { role: "system", content: systemInstruction },
        { role: "user",   content: prompt },
      ],
      temperature: 0.1,
      max_tokens:  200,
    });
    rawResp = (completion.choices[0].message.content ?? "").trim();
    console.log("[test-size] Groq raw:", rawResp);
  } catch (aiErr) {
    const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
    console.error("[test-size] Groq error:", aiErr);
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 502 });
  }

  // ── Parse JSON with fuzzy fallback ─────────────────────────
  let parsed: { recommendedSize: string; status: string; message: string };
  try {
    const jsonMatch = rawResp.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] || rawResp);
    if (!validSizes.includes(parsed.recommendedSize)) throw new Error("invalid size");
  } catch {
    const norm = (s: string) => s.replace(/[\s/]/g, "").toLowerCase();
    const size = validSizes.find(s => norm(rawResp).includes(norm(s))) || validSizes[0] || "";
    parsed = { recommendedSize: size, status: "available", message: "" };
  }

  return NextResponse.json({ size: parsed.recommendedSize, status: parsed.status, message: parsed.message });
}
