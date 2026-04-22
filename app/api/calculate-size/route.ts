import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// TODO: Add Upstash Redis rate limiting here when account is ready
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";

function normalizeOrigin(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
  }
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

type SizeChart = {
  columns: { id: string; label: string; quiz_field: string }[];
  rows: Record<string, unknown>[];
};

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new Response(null, { headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const rawOrigin = req.headers.get("origin") || req.headers.get("referer") || "";
  const normalizedOrigin = normalizeOrigin(rawOrigin);
  const timestamp = new Date().toISOString();
  const CORS = corsHeaders(rawOrigin);

  // Parse body first
  let tag: string, answers: Record<string, string>;
  try {
    const body = await req.json();
    tag     = body.tag;
    answers = body.answers;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  if (!tag || !answers) {
    return NextResponse.json({ error: "tag and answers required" }, { status: 400, headers: CORS });
  }

  // ══════════════════════════════════════════════════════════
  // LAYER 1 — Domain Validation & Merchant Identification
  // ══════════════════════════════════════════════════════════
  const { data: domainRow } = await supabase
    .from("merchant_domains")
    .select("user_id")
    .eq("domain", normalizedOrigin)
    .single();

  if (!domainRow) {
    console.log(`[${timestamp}] REJECTED — Unauthorized domain: "${normalizedOrigin}" (raw: "${rawOrigin}")`);
    return NextResponse.json({ error: "Unauthorized domain" }, { status: 403, headers: CORS });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", domainRow.user_id)
    .single();

  if (!merchant) {
    console.log(`[${timestamp}] ERROR — No merchant for user_id: ${domainRow.user_id}`);
    return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });
  }

  const merchantId = merchant.id;
  console.log(`[${timestamp}] AUTHORIZED — domain: ${normalizedOrigin}, merchant: ${merchantId}`);

  // ══════════════════════════════════════════════════════════
  // LAYER 2 — Rate Limiting (Upstash — add when ready)
  // ══════════════════════════════════════════════════════════
  // TODO: Uncomment when Upstash env vars are set
  // const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(50, "1 m") });
  // const { success } = await ratelimit.limit(merchantId);
  // if (!success) { console.log(`[${timestamp}] RATE LIMITED — ${merchantId}`); return 429; }

  // ══════════════════════════════════════════════════════════
  // LAYER 3 — AI Calculation
  // ══════════════════════════════════════════════════════════
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error(`[${timestamp}] GOOGLE_AI_API_KEY missing`);
    return NextResponse.json({ error: "AI not configured" }, { status: 500, headers: CORS });
  }

  // Fetch size chart from DB (case-insensitive tag match)
  const { data: category } = await supabase
    .from("categories")
    .select("size_chart, name")
    .eq("merchant_id", merchantId)
    .ilike("tag", tag)
    .single();

  if (!category?.size_chart) {
    console.log(`[${timestamp}] NOT FOUND — tag: "${tag}", merchant: ${merchantId}`);
    return NextResponse.json({ error: `No category for tag: ${tag}` }, { status: 404, headers: CORS });
  }

  const sizeChart = category.size_chart as SizeChart;
  const validSizes = sizeChart.rows.map(r => String(r.size));

  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as { min: number; max: number } | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const shouldersMap: Record<string, string> = { wide: "عريضة", average: "متوسطة", narrow: "ضيقة" };
  const legsMap: Record<string, string>      = { long: "طويلة",  average: "متوسطة", short: "قصيرة" };
  const bellyMap: Record<string, string>     = { flat: "مسطحة",  average: "متوسطة", big: "كبيرة"  };

  const systemInstruction = `You are a Master Tailor specializing in Abayas and long modest wear.
PRIORITY RULE — Width > Length: If weight suggests a larger size but height suggests smaller, prioritize the LARGER size for comfort.
BOUNDARY RULE: When measurements fall between two sizes, ALWAYS choose the larger one.
STRICT OUTPUT: Return ONLY the exact size name as written in the chart (e.g. "L / 56"). No greetings, no explanations.`;

  const prompt = `VALID SIZES — copy one exactly:
${validSizes.map(s => `"${s}"`).join(" | ")}

CUSTOMER:
- Height: ${answers.height} cm
- Weight: ${answers.weight} kg
- Shoulders: ${shouldersMap[answers.shoulders] || answers.shoulders}
- Legs: ${legsMap[answers.legs] || answers.legs}
- Belly: ${bellyMap[answers.belly] || answers.belly}

SIZE CHART (${category.name}):
${chartTable}

STEP-BY-STEP:
1. Height ${answers.height} cm → fits which size(s)?
2. Weight ${answers.weight} kg → fits which size(s)?
3. Apply Priority Rule (Weight wins) → select size
4. belly="${answers.belly}", shoulders="${answers.shoulders}" → adjust if needed
5. If between sizes → go larger

FINAL SIZE (exact name only):`;

  console.log(`[${timestamp}] AI request — tag: ${tag}, answers: ${JSON.stringify(answers)}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction,
    generationConfig: { temperature: 0.0, maxOutputTokens: 50 },
  });

  const result   = await model.generateContent(prompt);
  const rawResp  = result.response.text().trim();
  console.log(`[${timestamp}] Gemini raw: "${rawResp}"`);

  // Validate: extract exact size from response
  const lines = rawResp.split("\n").map((l: string) => l.trim()).filter(Boolean);
  let size = "";

  for (const line of [...lines].reverse()) {
    const match = validSizes.find(s => line.includes(s));
    if (match) { size = match; break; }
  }
  if (!size) {
    const norm = (s: string) => s.replace(/[\s/]/g, "").toLowerCase();
    const last = lines[lines.length - 1] || rawResp;
    size = validSizes.find(s => norm(last).includes(norm(s))) || "";
  }
  if (!size) size = validSizes.find(s => rawResp.includes(s)) || "";

  console.log(`[${timestamp}] Final size: "${size}"`);

  if (!size) {
    return NextResponse.json({ error: "AI returned invalid size" }, { status: 422, headers: CORS });
  }

  // Return size + sizeChart (for widget out-of-stock fallback)
  return NextResponse.json({ size, sizeChart }, { headers: CORS });
}
