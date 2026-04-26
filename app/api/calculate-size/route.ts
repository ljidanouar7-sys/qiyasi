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

type DeterministicResult = {
  sizeName:         string;
  adjustments:      string[];
  disclaimer:       string | null;
  adjustmentScore:  number;   // raw pre-clamp accumulator
  wasCapped:        boolean;  // |score| > 1 was clamped to ±1
  wasLengthParadox: boolean;  // idx was pulled back by the 2-size gap rule
  finalIdx:         number;   // final row index (needed for next-best lookup)
};

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
  const upper = s.trim().toUpperCase();
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

// ── Sizing helpers ─────────────────────────────────────────

// Returns -1 if value doesn't fit this row's range.
// When skipBoundaryPush is false (default), values in the top 2% of the span
// are pushed to the next size (fabric has no stretch to compensate).
// When skipBoundaryPush is true (fabric_stretchy), the push is disabled.
function findSizeIndex(
  rows: SizeChartRow[],
  colId: string,
  value: number,
  skipBoundaryPush = false
): number {
  return rows.findIndex(row => {
    const range = row[colId] as Range | undefined;
    if (!range) return false;
    if (value < range.min || value > range.max) return false;
    if (!skipBoundaryPush) {
      const span = range.max - range.min;
      if (span > 0 && (value - range.min) / span >= 0.98) return false;
    }
    return true;
  });
}

// 50% midpoint — used for the narrow build (-1) trigger only
function isUpperHalf(value: number, range: Range): boolean {
  return value >= (range.min + range.max) / 2;
}

// Upper 40% of span — used for broad shoulders and big belly (+1) triggers.
// More conservative than 50%: only upsizes when the customer is genuinely
// near the top of the current range, reducing "oversizing" complaints.
function isUpper40Percent(value: number, range: Range): boolean {
  return value >= range.min + (range.max - range.min) * 0.60;
}

// Scan sizeChart.columns for the first matching column ID.
function findColumnId(columns: SizeChartColumn[], ...ids: string[]): string | null {
  for (const id of ids) {
    if (columns.some(c => c.id === id)) return id;
  }
  return null;
}

// ── Main deterministic sizing ──────────────────────────────
function calculateSizeDeterministic(params: {
  sizeChart:       SizeChart;
  height:          number;
  weight:          number;
  shoulders:       string;
  belly:           string;
  fitType:         string;
  userPreference:  string;
  lang:            string;
  fabricStretchy:  boolean;
}): DeterministicResult {
  const { sizeChart, height, weight, shoulders, belly,
          fitType, userPreference, lang, fabricStretchy } = params;
  const { rows, columns } = sizeChart;
  const adjustments: string[] = [];

  // ── Phase A: Baseline (Abaya Floor) ──────────────────────
  let i_h = findSizeIndex(rows, "h", height, fabricStretchy);
  let i_w = findSizeIndex(rows, "w", weight, fabricStretchy);

  if (i_h < 0) {
    const lastH = rows[rows.length - 1]?.h as Range | undefined;
    i_h = (lastH && height > lastH.max) ? rows.length - 1 : 0;
  }
  if (i_w < 0) {
    const lastW = rows[rows.length - 1]?.w as Range | undefined;
    i_w = (lastW && weight > lastW.max) ? rows.length - 1 : 0;
  }

  const baseline = Math.max(i_h, i_w);

  // ── Phase B: Adjustment Accumulator ──────────────────────
  let adjustmentScore = 0;

  // Broad shoulders: use chest column (ch) if available, fallback to weight (w).
  // +1 only if weight is in the upper 40% of the range (conservative threshold).
  const chestColId = findColumnId(columns, "ch") ?? "w";
  const chestRange = rows[baseline]?.[chestColId] as Range | undefined;
  if (shoulders === "wide" && chestRange && isUpper40Percent(weight, chestRange)) {
    adjustmentScore += 1;
    adjustments.push("broad shoulders (+4 cm shoulder offset)");
  }

  // Protruding abdomen: use waist (wa) or hips (hi) if available, fallback to weight.
  // +1 only if weight is in the upper 40% of the range.
  const waistColId = findColumnId(columns, "wa", "hi") ?? "w";
  const waistRange = rows[baseline]?.[waistColId] as Range | undefined;
  if (belly === "big" && waistRange && isUpper40Percent(weight, waistRange)) {
    adjustmentScore += 1;
    adjustments.push("protruding abdomen (+7 cm waist offset)");
  }

  // Narrow build: -1 only if weight is in the lower half of the range (50% threshold).
  const narrowColId = findColumnId(columns, "ch") ?? "w";
  const narrowRange = rows[baseline]?.[narrowColId] as Range | undefined;
  if (shoulders === "narrow" && belly === "flat" && narrowRange && !isUpperHalf(weight, narrowRange)) {
    adjustmentScore -= 1;
    adjustments.push("narrow build");
  }

  // Slim fit + loose preference: customer needs extra room in a narrow-cut style.
  if (fitType === "slim" && userPreference === "loose") {
    adjustmentScore += 1;
    adjustments.push("loose preference on slim-cut design");
  }

  // Oversized + fitted preference: informational disclaimer only — index unchanged.
  let disclaimer: string | null = null;
  if (fitType === "oversized" && userPreference === "fitted") {
    disclaimer = lang === "Arabic"
      ? "هذا الطراز مصمم ليكون فضفاضاً بطبيعته — هذا هو المقاس المناسب"
      : "This style is intentionally oversized — this is the correct size for you.";
    adjustments.push("fitted preference on oversized style");
  }

  // ── Phase C: Safety Cap (±1 from baseline) ───────────────
  // Prevents multiple triggers from stacking beyond one size change.
  const clampedScore = Math.min(Math.max(adjustmentScore, -1), 1);
  const wasCapped    = adjustmentScore !== clampedScore;
  let idx = Math.min(Math.max(baseline + clampedScore, 0), rows.length - 1);

  // ── Phase D: Length Paradox (2-size gap rule) ────────────
  // If the width-driven size is more than 2 sizes above the height-driven size,
  // cap it at i_h + 2. A garment cannot compensate for a >2-size length mismatch.
  let wasLengthParadox = false;
  if (idx > i_h + 2) {
    idx = Math.min(i_h + 2, rows.length - 1);
    wasLengthParadox = true;
    const lengthNote = lang === "Arabic"
      ? "هذا المقاس مناسب لعرض الجسم، لكن العباءة ستكون طويلة جداً وتحتاج إلى تقصير."
      : "This size fits your width, but the garment will be significantly long and will require shortening.";
    disclaimer = disclaimer ? `${disclaimer} | ${lengthNote}` : lengthNote;
  }

  return {
    sizeName:         String(rows[idx]?.size ?? ""),
    adjustments,
    disclaimer,
    adjustmentScore,
    wasCapped,
    wasLengthParadox,
    finalIdx: idx,
  };
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
    .select("size_chart, name, fit_type, fabric_stretchy")
    .eq("merchant_id", merchantId)
    .ilike("tag", tag)
    .single();

  if (!category?.size_chart) {
    console.log(`[${timestamp}] NOT FOUND — tag: "${tag}", merchant: ${merchantId}`);
    return NextResponse.json({ error: `No category for tag: ${tag}` }, { status: 404, headers: CORS });
  }

  const sizeChart      = category.size_chart as SizeChart;
  const fitType        = (category.fit_type as string)        || "regular";
  const fabricStretchy = Boolean(category.fabric_stretchy);

  // ══════════════════════════════════════════════════════════
  // LAYER 4 — Deterministic Size Calculation
  // ══════════════════════════════════════════════════════════
  const result = calculateSizeDeterministic({
    sizeChart,
    height:         Number(answers.height  || 0),
    weight:         Number(answers.weight  || 0),
    shoulders:      answers.shoulders      || "average",
    belly:          answers.belly          || "average",
    fitType,
    userPreference: user_preference,
    lang,
    fabricStretchy,
  });

  let { sizeName, finalIdx } = result;
  const { adjustments, disclaimer, adjustmentScore, wasCapped, wasLengthParadox } = result;

  // ── Stock check + Next Best ────────────────────────────────
  let finalStatus = "available";
  let isNextBest  = false;
  const idealSizeName = sizeName; // preserve before possible next-best substitution

  if (stock_info && Object.keys(stock_info).length > 0) {
    const primaryEntry    = Object.entries(stock_info).find(([k]) => sizesMatch(k, sizeName));
    const primaryAvailable = primaryEntry && Number(primaryEntry[1]) > 0;

    if (!primaryAvailable) {
      finalStatus = "out_of_stock";

      // If the next size up is available, recommend it instead
      const nextRow = sizeChart.rows[finalIdx + 1];
      if (nextRow) {
        const nextSizeName = String(nextRow.size ?? "");
        const nextEntry    = Object.entries(stock_info).find(([k]) => sizesMatch(k, nextSizeName));
        if (nextEntry && Number(nextEntry[1]) > 0) {
          sizeName    = nextSizeName;
          finalStatus = "available";
          isNextBest  = true;
          adjustments.push("next best size — recommended size out of stock");
        }
      }
    }
  }

  console.log(
    `[${timestamp}] size: "${sizeName}"${isNextBest ? ` (next-best, ideal: "${idealSizeName}")` : ""}` +
    ` | status: "${finalStatus}" | score: ${adjustmentScore}${wasCapped ? " (capped)" : ""}` +
    `${wasLengthParadox ? " (length-paradox)" : ""} | adjustments: [${adjustments.join(", ")}]`
  );

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

CRITICAL RULES:
1. NEVER suggest a different size than "${sizeName}". Do NOT contradict the system's decision.
2. Keep the message under 20 words.
${wasCapped         ? "3. Multiple body-shape triggers fired simultaneously; the system balanced the recommendation to keep the garment length manageable." : ""}
${wasLengthParadox  ? "3. The size was limited to prevent an excessive length mismatch — the customer should be informed the garment may need shortening." : ""}
${isNextBest        ? `3. The ideal size (${idealSizeName}) is out of stock; the system switched to the next available size (${sizeName}).` : ""}

DECISION:
- Chosen size: ${sizeName}
- Fit type: ${fitType}
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

  // Fallback text used if AI call fails
  const fallbackAI = {
    message: isNextBest
      ? (lang === "Arabic"
          ? `مقاسك المثالي غير متوفر — ننصحك بمقاس ${sizeName} كبديل متاح`
          : `Your ideal size is out of stock — we recommend ${sizeName} as the next available option`)
      : (lang === "Arabic"
          ? `مقاسك المناسب هو ${sizeName}${finalStatus === "out_of_stock" ? " — غير متوفر حالياً" : ""}`
          : `Your recommended size is ${sizeName}${finalStatus === "out_of_stock" ? " — currently out of stock" : ""}`),
    reasoning: adjustments.filter(a => a !== "next best size — recommended size out of stock").length
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
