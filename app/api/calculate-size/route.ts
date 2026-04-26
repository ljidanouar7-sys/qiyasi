import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  calculateSize,
  scoreAllSizes,
  STRETCH_BUFFER,
  type SizeChart,
  type SizeScore,
  type FabricStretchLevel,
  type Range,
} from "@/lib/sizing-engine";

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

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey:  process.env.GROQ_API_KEY!,
});

// ── CORS ───────────────────────────────────────────────────────────────────────

function normalizeOrigin(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin":  origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

// ── Size normalization for stock matching ──────────────────────────────────────
// Handles "S / 52", "52", "S", "XL" etc. as the same size.

function normalizeSize(s: string) {
  const upper       = s.trim().toUpperCase();
  const letterMatch = upper.match(/\b(4XL|3XL|XXL|XL|XS|S|M|L)\b/);
  return {
    letter: letterMatch?.[1] ?? upper.match(/[A-Z]+/)?.[0] ?? "",
    num:    upper.match(/\d+/)?.[0] ?? "",
    raw:    upper,
  };
}

function sizesMatch(a: string, b: string): boolean {
  const na = normalizeSize(a), nb = normalizeSize(b);
  if (na.letter && nb.letter && na.letter === nb.letter) return true;
  if (na.num    && nb.num    && na.num    === nb.num)    return true;
  return na.raw === nb.raw;
}

// ── OPTIONS ────────────────────────────────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new Response(null, { headers: corsHeaders(origin) });
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawOrigin        = req.headers.get("origin") || req.headers.get("referer") || "";
  const normalizedOrigin = normalizeOrigin(rawOrigin);
  const timestamp        = new Date().toISOString();
  const CORS             = corsHeaders(rawOrigin);

  if (!req.headers.get("origin")) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    console.warn(`[${timestamp}] WARNING — no Origin header (possible curl/script), IP: ${ip}`);
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let tag: string,
      answers: Record<string, string>,
      stock_info: Record<string, number> | null,
      lang: string,
      user_preference: string;
  try {
    const body     = await req.json();
    tag             = body.tag;
    answers         = body.answers;
    stock_info      = body.stock_info || null;
    user_preference = (body.user_preference || "regular") as string;
    const langRaw   = (body.lang || "ar").toLowerCase();
    lang            = (langRaw.startsWith("ar") || langRaw === "arabic") ? "Arabic" : "English";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  if (!tag || !answers) {
    return NextResponse.json({ error: "tag and answers required" }, { status: 400, headers: CORS });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LAYER 1 — Domain Validation
  // ══════════════════════════════════════════════════════════════════════════════

  const { data: domainRow } = await supabase
    .from("merchant_domains")
    .select("user_id")
    .eq("domain", normalizedOrigin)
    .single();

  if (!domainRow) {
    console.log(`[${timestamp}] REJECTED — Unauthorized domain: "${normalizedOrigin}"`);
    return NextResponse.json({ error: "Unauthorized domain" }, { status: 403, headers: CORS });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", domainRow.user_id)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });
  }

  const merchantId = merchant.id;
  console.log(`[${timestamp}] AUTHORIZED — domain: ${normalizedOrigin}, merchant: ${merchantId}`);

  // ══════════════════════════════════════════════════════════════════════════════
  // LAYER 2 — Rate Limiting
  // ══════════════════════════════════════════════════════════════════════════════

  const { success, limit, remaining } = await ratelimit.limit(merchantId);
  if (!success) {
    return NextResponse.json(
      { error: lang === "Arabic" ? "الكثير من الطلبات — حاول بعد دقيقة" : "Too many requests — try again in a minute" },
      { status: 429, headers: { ...CORS, "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LAYER 3 — Fetch Size Chart
  // ══════════════════════════════════════════════════════════════════════════════

  const { data: category } = await supabase
    .from("categories")
    .select("size_chart, name, fabric_stretch_level, fabric_stretchy")
    .eq("merchant_id", merchantId)
    .ilike("tag", tag)
    .single();

  if (!category?.size_chart) {
    return NextResponse.json({ error: `No category for tag: ${tag}` }, { status: 404, headers: CORS });
  }

  const sizeChart = category.size_chart as SizeChart;

  // Backward-compat: fabric_stretch_level may be null on old rows → fall back to fabric_stretchy boolean
  const rawLevel = category.fabric_stretch_level as number | null;
  const fabricStretchLevel: FabricStretchLevel =
    rawLevel === 0 || rawLevel === 1 || rawLevel === 2
      ? rawLevel
      : (category.fabric_stretchy ? 1 : 0);

  // ══════════════════════════════════════════════════════════════════════════════
  // LAYER 4 — Scoring Engine
  // ══════════════════════════════════════════════════════════════════════════════

  const result = calculateSize({
    sizeChart,
    height:             Number(answers.height  || 0),
    weight:             Number(answers.weight  || 0),
    shoulders:          answers.shoulders      || "average",
    belly:              answers.belly          || "average",
    userPreference:     user_preference,
    lang,
    fabricStretchLevel,
  });

  let sizeName  = result.recommended;
  let finalIdx  = result.recommendedIdx;
  const { alternatives, confidence, explanation, wasLengthWarning } = result;
  let disclaimer    = result.disclaimer;
  const { chest, waist, hips } = result.estimatedBody;

  console.log(
    `[${timestamp}] size: "${sizeName}" | confidence: ${confidence}% | alts: [${alternatives.join(", ")}]` +
    `${wasLengthWarning ? " | length-warning" : ""} | ${explanation[0]}`
  );

  // ── Phase 7: Stock-aware next best (checks both adjacent sizes by score) ─────

  let finalStatus = "available";
  let isNextBest  = false;
  const idealSizeName = sizeName;

  if (stock_info && Object.keys(stock_info).length > 0) {
    const primaryEntry     = Object.entries(stock_info).find(([k]) => sizesMatch(k, sizeName));
    const primaryAvailable = primaryEntry && Number(primaryEntry[1]) > 0;

    if (!primaryAvailable) {
      finalStatus = "out_of_stock";

      // Re-score to find the best available adjacent size in either direction
      const allScores = scoreAllSizes(
        sizeChart, result.estimatedBody,
        Number(answers.height || 0), Number(answers.weight || 0),
        STRETCH_BUFFER[fabricStretchLevel]
      );
      const candidates = [finalIdx + 1, finalIdx - 1]
        .map(idx => allScores.find(s => s.rowIdx === idx))
        .filter((c): c is SizeScore => !!c)
        .filter(c => {
          const e = Object.entries(stock_info).find(([k]) => sizesMatch(k, c.sizeName));
          return e ? Number(e[1]) > 0 : false;
        })
        .sort((a, b) => b.totalScore - a.totalScore);

      if (candidates[0]) {
        sizeName    = candidates[0].sizeName;
        finalIdx    = candidates[0].rowIdx;
        finalStatus = "available";
        isNextBest  = true;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LAYER 5 — AI Reasoning (text only — never overrides the engine decision)
  // ══════════════════════════════════════════════════════════════════════════════

  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as Range | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const reasoningPrompt =
`A customer needs a size recommendation. The system already chose the size — write a friendly explanation only.

CRITICAL: NEVER suggest a different size than "${sizeName}". Do NOT contradict the system.

DECISION:
- Recommended size: ${sizeName} (confidence: ${confidence}%)
- Alternatives considered: ${alternatives.join(", ") || "none"}
- Availability: ${finalStatus}
${isNextBest ? `- Note: ideal size (${idealSizeName}) was out of stock; switched to nearest available (${sizeName})` : ""}
${disclaimer ? `- Disclaimer: ${disclaimer}` : ""}

ENGINE DATA:
- Estimated body: chest ${chest}cm, waist ${waist}cm, hips ${hips}cm
- Applied modifiers: shoulders=${answers.shoulders || "average"}, belly=${answers.belly || "average"}, preference=${user_preference}
- ${explanation.join("; ")}

CUSTOMER:
- Height: ${answers.height}cm, Weight: ${answers.weight}kg
- Fit preference: ${user_preference}

SIZE CHART (${category.name}):
${chartTable}

Return ONLY a JSON object in ${lang}:
{"message":"short friendly confirmation max 20 words","reasoning":"one sentence explaining the score-based selection"}`;

  const fallbackAI = {
    message: isNextBest
      ? (lang === "Arabic"
          ? `مقاسك المثالي غير متوفر — ننصحك بمقاس ${sizeName} كبديل متاح`
          : `Your ideal size is out of stock — we recommend ${sizeName} as the next available option`)
      : (lang === "Arabic"
          ? `مقاسك المناسب هو ${sizeName}${finalStatus === "out_of_stock" ? " — غير متوفر حالياً" : ""}`
          : `Your recommended size is ${sizeName}${finalStatus === "out_of_stock" ? " — currently out of stock" : ""}`),
    reasoning: lang === "Arabic"
      ? `اخترنا ${sizeName} بناءً على مقاساتك المقدّرة: صدر ${chest}سم، خصر ${waist}سم.`
      : `Size ${sizeName} scored highest for your estimated measurements: chest ${chest}cm, waist ${waist}cm.`,
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
      console.log(`[${timestamp}] Groq reasoning: "${rawResp}"`);
      const match     = rawResp.match(/\{[\s\S]*\}/);
      const candidate = JSON.parse(match?.[0] || rawResp);
      if (candidate.message && candidate.reasoning) parsedAI = candidate;
    } catch (aiErr) {
      console.error(`[${timestamp}] AI reasoning failed — using fallback:`, aiErr);
    }
  }

  return NextResponse.json({
    size:         sizeName,
    status:       finalStatus,
    confidence,
    alternatives,
    message:      parsedAI.message,
    reasoning:    parsedAI.reasoning,
    disclaimer:   disclaimer ?? undefined,
    sizeChart,
  }, { headers: CORS });
}
