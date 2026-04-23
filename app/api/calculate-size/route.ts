import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ratelimit = new Ratelimit({
  redis: new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter:   Ratelimit.slidingWindow(50, "1 m"),
  analytics: true,
  prefix:    "qiyasi_rl",
});

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

  if (!req.headers.get("origin")) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    console.warn(`[${timestamp}] WARNING — no Origin header (possible curl/script), IP: ${ip}`);
  }
  const CORS = corsHeaders(rawOrigin);

  // Parse body
  let tag: string, answers: Record<string, string>, stock_info: Record<string, number> | null;
  try {
    const body = await req.json();
    tag        = body.tag;
    answers    = body.answers;
    stock_info = body.stock_info || null;
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
  // LAYER 2 — Rate Limiting (50 requests/minute per merchant)
  // ══════════════════════════════════════════════════════════
  const { success, limit, remaining } = await ratelimit.limit(merchantId);
  if (!success) {
    console.log(`[${timestamp}] RATE LIMITED — merchant: ${merchantId}`);
    return NextResponse.json(
      { error: "الكثير من الطلبات — حاول بعد دقيقة" },
      { status: 429, headers: { ...CORS, "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  // ══════════════════════════════════════════════════════════
  // LAYER 3 — AI Calculation (Gemma 4 31B IT)
  // ══════════════════════════════════════════════════════════
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error(`[${timestamp}] GOOGLE_AI_API_KEY missing`);
    return NextResponse.json({ error: "AI not configured" }, { status: 500, headers: CORS });
  }

  // Fetch size chart from DB (size_chart never comes from client)
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

  const sizeChart  = category.size_chart as SizeChart;
  const validSizes = sizeChart.rows.map(r => String(r.size));

  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as { min: number; max: number } | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const stockLines = stock_info
    ? Object.entries(stock_info).map(([s, q]) => `${s}: ${q}`).join(" | ")
    : "Not provided — set status \"available\"";

  const shouldersMap: Record<string, string> = { wide: "wide", average: "average", narrow: "narrow" };
  const legsMap: Record<string, string>      = { long: "long", average: "average", short: "short" };
  const bellyMap: Record<string, string>     = { flat: "flat", average: "average", big: "big" };

  const systemInstruction = `You are a professional tailor specializing in abayas and djellabas.
Rules:
1. Priority to WIDTH (weight) over height — if weight suggests a larger size, choose larger.
2. When between two sizes, ALWAYS size up.
3. Check stock_info: if quantity > 0 → status "available", else "out_of_stock".
4. Do NOT suggest an alternative size. If the recommended size is out of stock, set status "out_of_stock" and DO NOT propose another size.
5. Output ONLY a JSON object. No markdown, no extra text.`;

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

STOCK INFO:
${stockLines}

OUTPUT (strict JSON only, no extra text):
{"recommendedSize":"exact size from chart","status":"available|out_of_stock","message":"short user-friendly message in Arabic"}`;

  console.log(`[${timestamp}] AI request — tag: ${tag}, stock_info: ${JSON.stringify(stock_info)}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction,
    generationConfig: { temperature: 0.0, maxOutputTokens: 200 },
  });

  let rawResp: string;
  try {
    const result = await model.generateContent(prompt);
    rawResp = result.response.text().trim();
  } catch (aiErr) {
    console.error(`[${timestamp}] Gemma error:`, aiErr);
    return NextResponse.json({ error: "AI request failed" }, { status: 502, headers: CORS });
  }
  console.log(`[${timestamp}] Gemma raw: "${rawResp}"`);

  // Parse JSON response with fallback to fuzzy match
  let parsed: { recommendedSize: string; status: string; message: string };
  try {
    const jsonMatch = rawResp.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] || rawResp);
    if (!validSizes.includes(parsed.recommendedSize)) throw new Error("invalid size in JSON");
  } catch {
    // Fallback: fuzzy match on raw text
    const lines = rawResp.split("\n").map(l => l.trim()).filter(Boolean);
    let size = "";
    for (const line of [...lines].reverse()) {
      const match = validSizes.find(s => line.includes(s));
      if (match) { size = match; break; }
    }
    if (!size) {
      const norm = (s: string) => s.replace(/[\s/]/g, "").toLowerCase();
      size = validSizes.find(s => norm(rawResp).includes(norm(s))) || "";
    }
    if (!size) {
      console.log(`[${timestamp}] AI returned invalid response`);
      return NextResponse.json({ error: "AI returned invalid size" }, { status: 422, headers: CORS });
    }
    parsed = { recommendedSize: size, status: "available", message: "" };
  }

  console.log(`[${timestamp}] Final size: "${parsed.recommendedSize}", status: "${parsed.status}"`);

  return NextResponse.json({
    size:      parsed.recommendedSize,
    status:    parsed.status,
    message:   parsed.message,
    sizeChart,
  }, { headers: CORS });
}
