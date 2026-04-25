import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
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

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey:  process.env.GROQ_API_KEY!,
});

// ── Types ──────────────────────────────────────────────────
type SizeChartColumn = { id: string; label: string; quiz_field: string };
type SizeChartRow    = Record<string, unknown>;
type SizeChart       = { columns: SizeChartColumn[]; rows: SizeChartRow[] };
type Range           = { min: number; max: number };

// ── CORS ───────────────────────────────────────────────────
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

// ── Stock normalization ────────────────────────────────────
function normalizeSize(s: string) {
  return {
    letter: s.match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? "",
    num:    s.match(/\d+/)?.[0] ?? "",
    raw:    s.trim().toUpperCase(),
  };
}
function sizesMatch(a: string, b: string): boolean {
  const na = normalizeSize(a), nb = normalizeSize(b);
  if (na.letter && nb.letter && na.letter === nb.letter) return true;
  if (na.num    && nb.num    && na.num    === nb.num)    return true;
  return na.raw === nb.raw;
}

// ── Sizing helpers ─────────────────────────────────────────

// Returns -1 if value doesn't fit this row's range.
// The 95% edge triggers "next size up" to avoid tight fits.
function findSizeIndex(rows: SizeChartRow[], colId: string, value: number): number {
  return rows.findIndex(row => {
    const range = row[colId] as Range | undefined;
    if (!range) return false;
    if (value > range.max)         return false;
    if (value >= range.max * 0.95) return false; // near upper edge → push to next size
    return value >= range.min;
  });
}

function isUpperHalf(value: number, range: Range): boolean {
  return value >= (range.min + range.max) / 2;
}

// Scan sizeChart.columns for the first matching column ID.
// Lets the algorithm work with any merchant's custom column IDs.
function findColumnId(columns: SizeChartColumn[], ...ids: string[]): string | null {
  for (const id of ids) {
    if (columns.some(c => c.id === id)) return id;
  }
  return null;
}

// ── Main deterministic sizing ──────────────────────────────
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

  // ── Rule 1: Abaya Floor — height NEVER overridden ────────
  let i_h = findSizeIndex(rows, "h", height);
  let i_w = findSizeIndex(rows, "w", weight);

  // Clamp measurements that fall outside all chart ranges
  if (i_h < 0) {
    const lastH = rows[rows.length - 1]?.h as Range | undefined;
    i_h = (lastH && height > lastH.max) ? rows.length - 1 : 0;
  }
  if (i_w < 0) {
    const lastW = rows[rows.length - 1]?.w as Range | undefined;
    i_w = (lastW && weight > lastW.max) ? rows.length - 1 : 0;
  }

  let idx = Math.max(i_h, i_w); // height always wins

  // ── Rule 2: Body shape offsets ───────────────────────────
  // Broad shoulders (+4cm shoulder offset) →
  //   use chest column (ch) if merchant provided it, else fall back to weight (w)
  const chestColId = findColumnId(columns, "ch") ?? "w";
  const chestRange = rows[idx]?.[chestColId] as Range | undefined;
  if (shoulders === "wide" && chestRange && isUpperHalf(weight, chestRange)) {
    idx = Math.min(idx + 1, rows.length - 1);
    adjustments.push("broad shoulders (+4 cm shoulder offset)");
  }

  // Protruding abdomen (+7cm waist offset) →
  //   use waist (wa) or hips (hi) if available, else fall back to weight (w)
  const waistColId = findColumnId(columns, "wa", "hi") ?? "w";
  const waistRange = rows[idx]?.[waistColId] as Range | undefined;
  if (belly === "big" && waistRange && isUpperHalf(weight, waistRange)) {
    idx = Math.min(idx + 1, rows.length - 1);
    adjustments.push("protruding abdomen (+7 cm waist offset)");
  }

  // Narrow build → go down only if at lower half of range
  const narrowColId = findColumnId(columns, "ch") ?? "w";
  const narrowRange = rows[idx]?.[narrowColId] as Range | undefined;
  if (shoulders === "narrow" && belly === "flat" && narrowRange && !isUpperHalf(weight, narrowRange)) {
    idx = Math.max(idx - 1, 0);
    adjustments.push("narrow build");
  }

  // ── Rule 3: Fit Type × User Preference interaction ───────
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

// ── OPTIONS ────────────────────────────────────────────────
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new Response(null, { headers: corsHeaders(origin) });
}

// ── POST ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawOrigin        = req.headers.get("origin") || req.headers.get("referer") || "";
  const normalizedOrigin = normalizeOrigin(rawOrigin);
  const timestamp        = new Date().toISOString();
  const CORS             = corsHeaders(rawOrigin);

  if (!req.headers.get("origin")) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    console.warn(`[${timestamp}] WARNING — no Origin header (possible curl/script), IP: ${ip}`);
  }

  // ── Parse body ─────────────────────────────────────────────
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

    // Support 'ar', 'ar-SA', 'Arabic', 'arabic'
    const langRaw = (body.lang || "ar").toLowerCase();
    lang = (langRaw.startsWith("ar") || langRaw === "arabic") ? "Arabic" : "English";
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
      { error: lang === "Arabic" ? "الكثير من الطلبات — حاول بعد دقيقة" : "Too many requests — try again in a minute" },
      { status: 429, headers: { ...CORS, "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  // ══════════════════════════════════════════════════════════
  // LAYER 3 — Fetch Size Chart
  // ══════════════════════════════════════════════════════════
  const { data: category } = await supabase
    .from("categories")
    .select("size_chart, name, fit_type")
    .eq("merchant_id", merchantId)
    .ilike("tag", tag)
    .single();

  if (!category?.size_chart) {
    console.log(`[${timestamp}] NOT FOUND — tag: "${tag}", merchant: ${merchantId}`);
    return NextResponse.json({ error: `No category for tag: ${tag}` }, { status: 404, headers: CORS });
  }

  const sizeChart = category.size_chart as SizeChart;
  const fitType   = (category.fit_type as string) || "regular";

  // ══════════════════════════════════════════════════════════
  // LAYER 4 — Deterministic Size Calculation
  // ══════════════════════════════════════════════════════════
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

  // ── Stock check ────────────────────────────────────────────
  let finalStatus = "available";
  if (stock_info && Object.keys(stock_info).length > 0) {
    const entry = Object.entries(stock_info).find(([k]) => sizesMatch(k, sizeName));
    finalStatus = (entry && Number(entry[1]) > 0) ? "available" : "out_of_stock";
  }

  console.log(`[${timestamp}] Size: "${sizeName}", status: "${finalStatus}", adjustments: [${adjustments.join(", ")}]`);

  // ══════════════════════════════════════════════════════════
  // LAYER 5 — AI: Generate reasoning text only
  // ══════════════════════════════════════════════════════════
  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as Range | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const reasoningPrompt = `A customer needs an abaya size recommendation. The system already chose the size — your job is to write a friendly explanation.

DECISION:
- Chosen size: ${sizeName}
- Fit type of this product: ${fitType}
- Adjustments applied: ${adjustments.length ? adjustments.join("; ") : "none — straight height/weight match"}
- Availability: ${finalStatus}
${disclaimer ? `- Note: ${disclaimer}` : ""}

CUSTOMER:
- Height: ${answers.height} cm, Weight: ${answers.weight} kg
- Shoulders: ${answers.shoulders || "average"}, Belly: ${answers.belly || "average"}
- Fit preference: ${user_preference}

SIZE CHART (${category.name}):
${chartTable}

Return ONLY a JSON object in ${lang}:
{"message":"short friendly confirmation max 20 words","reasoning":"one sentence explaining why this size"}`;

  // Fallback text used if AI call fails or returns invalid JSON
  const fallbackAI = {
    message: lang === "Arabic"
      ? `مقاسك المناسب هو ${sizeName}${finalStatus === "out_of_stock" ? " — غير متوفر حالياً" : ""}`
      : `Your recommended size is ${sizeName}${finalStatus === "out_of_stock" ? " — currently out of stock" : ""}`,
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
      console.log(`[${timestamp}] Groq reasoning: "${rawResp}"`);
      const match     = rawResp.match(/\{[\s\S]*\}/);
      const candidate = JSON.parse(match?.[0] || rawResp);
      if (candidate.message && candidate.reasoning) parsedAI = candidate;
    } catch (aiErr) {
      console.error(`[${timestamp}] AI reasoning failed — using fallback:`, aiErr);
      // parsedAI stays as fallbackAI — no crash
    }
  }

  return NextResponse.json({
    size:       sizeName,
    status:     finalStatus,
    message:    parsedAI.message,
    reasoning:  parsedAI.reasoning,
    disclaimer: disclaimer ?? undefined,
    sizeChart,
  }, { headers: CORS });
}
