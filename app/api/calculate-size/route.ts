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
type SizeChartColumn  = { id: string; label: string; quiz_field: string };
type SizeChartRow     = Record<string, unknown>;
type SizeChart        = { columns: SizeChartColumn[]; rows: SizeChartRow[] };
type Range            = { min: number; max: number };
type FabricStretchLevel = 0 | 1 | 2;

type BodyMeasurements = {
  chest: number;
  waist: number;
  hips:  number;
};

type SizeScore = {
  sizeName:    string;
  rowIdx:      number;
  widthScore:  number;
  heightScore: number;
  totalScore:  number;
};

type SizingResult = {
  recommended:      string;
  recommendedIdx:   number;
  alternatives:     string[];
  confidence:       number;
  explanation:      string[];
  disclaimer:       string | null;
  wasLengthWarning: boolean;
  estimatedBody:    BodyMeasurements;
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
  const upper        = s.trim().toUpperCase();
  const letterMatch  = upper.match(/\b(4XL|3XL|XXL|XL|XS|S|M|L)\b/);
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

// ══════════════════════════════════════════════════════════
// SIZING ENGINE
// ══════════════════════════════════════════════════════════

// stretch buffer per level: 0=rigid, 1=light stretch, 2=high stretch
const STRETCH_BUFFER: Record<FabricStretchLevel, number> = { 0: 0, 1: 2, 2: 4 };

// Height contributes 50% of total score for floor-length garments.
// Length error is as costly as width error for abayas.
const HEIGHT_FACTOR = 0.50;

// ── Phase 0+1: Body Measurement Estimation ────────────────
//
// Estimates chest, waist, hips (cm) from height (cm) + weight (kg).
// Uses proportional scaling anchored at reference BMI 22,
// calibrated for Arab female body proportions.
//
// Verified:
//   165/65 kg → chest 93.3, waist 78.3, hips 101.2
//   170/70 kg → chest 96.6, waist 81.4, hips 104.7
//   170/80 kg → chest 104.3, waist 91.9, hips 111.7
function estimateBody(height: number, weight: number): BodyMeasurements {
  const bmi      = weight / Math.pow(height / 100, 2);
  const bmiDelta = bmi - 22;
  return {
    chest: Math.round((height * 0.540 + bmiDelta * 2.2) * 10) / 10,
    waist: Math.round((height * 0.440 + bmiDelta * 3.0) * 10) / 10,
    hips:  Math.round((height * 0.590 + bmiDelta * 2.0) * 10) / 10,
  };
}

// ── Body shape qualitative modifiers ──────────────────────
function applyBodyShape(
  body:      BodyMeasurements,
  shoulders: string,
  belly:     string
): BodyMeasurements {
  let { chest, waist, hips } = body;
  if (shoulders === "wide")   { chest += 4; hips  += 1; }
  if (shoulders === "narrow") { chest -= 3; }
  if (belly === "big")        { waist += 7; hips  += 3; }
  if (belly === "flat")       { waist -= 3; }
  return { chest, waist, hips };
}

// ── Phase 3: Fit preference modifier ──────────────────────
// Shifts effective measurements instead of jumping sizes.
const PREF_DELTA: Record<string, number> = { fitted: -2, regular: 0, loose: 3 };

function applyFitPreference(
  body:       BodyMeasurements,
  preference: string,
  fitType:    string
): BodyMeasurements {
  let delta = PREF_DELTA[preference] ?? 0;
  if (fitType === "slim" && preference === "loose") delta += 2;
  return {
    chest: body.chest + delta,
    waist: body.waist + delta,
    hips:  body.hips  + delta,
  };
}

// ── Phase 2+4: Continuous fit score ───────────────────────
//
// Returns 0.0–1.0:
//   1.00 at center of range
//   0.70 at range boundaries
//   Decreasing penalty outside range (heavier for too-tight than too-loose)
//   stretchBuffer expands the effective upper boundary for stretchy fabrics
function fitScore(value: number, range: Range, stretchBuffer: number): number {
  if (range.max <= range.min) return 0.5;

  const center   = (range.min + range.max) / 2;
  const halfSpan = (range.max - range.min) / 2;
  const adjMax   = range.max + stretchBuffer;

  if (value >= range.min && value <= adjMax) {
    const distFromCenter = Math.abs(value - center);
    const maxDist        = Math.max(adjMax - center, halfSpan);
    return 1.0 - (distFromCenter / maxDist) * 0.30;
  }

  if (value < range.min) {
    // Under range: garment too loose — moderate penalty
    const gap = range.min - value;
    return Math.max(0, 0.70 - (gap / halfSpan) * 0.55);
  }

  // Over adjusted max: garment too tight — heavier penalty
  const gap = value - adjMax;
  return Math.max(0, 0.70 - (gap / halfSpan) * 0.90);
}

// ── Score all size rows ────────────────────────────────────
function scoreAllSizes(
  sizeChart:  SizeChart,
  body:       BodyMeasurements,
  height:     number,
  weight:     number,
  stretchBuf: number
): SizeScore[] {
  const colIds     = new Set(sizeChart.columns.map(c => c.id));
  const hasBodyCols = colIds.has("ch") || colIds.has("wa") || colIds.has("hi");

  return sizeChart.rows.map((row, rowIdx) => {
    let widthScore: number;

    if (hasBodyCols) {
      // Score against estimated body measurements (cm vs cm)
      const parts = [
        { id: "ch", measure: body.chest, w: 0.50 },
        { id: "wa", measure: body.waist, w: 0.30 },
        { id: "hi", measure: body.hips,  w: 0.20 },
      ];
      let totalW = 0, totalS = 0;
      for (const p of parts) {
        if (!colIds.has(p.id)) continue;
        const range = row[p.id] as Range | undefined;
        if (!range) continue;
        totalW += p.w;
        totalS += p.w * fitScore(p.measure, range, stretchBuf);
      }
      widthScore = totalW > 0 ? totalS / totalW : 0.5;
    } else {
      // Fallback: chart has only weight column — score weight vs weight range (same unit)
      const wRange = row["w"] as Range | undefined;
      widthScore = wRange ? fitScore(weight, wRange, 0) : 0.5;
    }

    // Height score — always compared to h column, no stretch
    const hRange      = row["h"] as Range | undefined;
    const heightScore = hRange ? fitScore(height, hRange, 0) : 0.5;

    const totalScore = widthScore * (1 - HEIGHT_FACTOR) + heightScore * HEIGHT_FACTOR;

    return {
      sizeName: String(row.size ?? ""),
      rowIdx,
      widthScore,
      heightScore,
      totalScore,
    };
  });
}

// ── Main engine ────────────────────────────────────────────
function calculateSize(params: {
  sizeChart:          SizeChart;
  height:             number;
  weight:             number;
  shoulders:          string;
  belly:              string;
  fitType:            string;
  userPreference:     string;
  lang:               string;
  fabricStretchLevel: FabricStretchLevel;
}): SizingResult {
  const { sizeChart, height, weight, shoulders, belly,
          fitType, userPreference, lang, fabricStretchLevel } = params;
  const { rows } = sizeChart;
  const explanation: string[] = [];
  let disclaimer: string | null = null;

  if (rows.length === 0) {
    return {
      recommended: "", recommendedIdx: 0, alternatives: [],
      confidence: 0, explanation: ["Empty size chart"], disclaimer: null,
      wasLengthWarning: false, estimatedBody: { chest: 0, waist: 0, hips: 0 },
    };
  }

  // ── Phases 0+1: Estimate body ──────────────────────────
  const rawBody    = estimateBody(height, weight);
  const shapedBody = applyBodyShape(rawBody, shoulders, belly);
  const finalBody  = applyFitPreference(shapedBody, userPreference, fitType);

  explanation.push(
    `Estimated body: chest ${rawBody.chest}cm, waist ${rawBody.waist}cm, hips ${rawBody.hips}cm`
  );
  if (shoulders !== "average" || belly !== "average") {
    explanation.push(
      `Shape modifiers applied: shoulders=${shoulders}, belly=${belly}`
    );
  }

  // ── Phase 2+4: Score all sizes ─────────────────────────
  const stretchBuf = STRETCH_BUFFER[fabricStretchLevel];
  const scores     = scoreAllSizes(sizeChart, finalBody, height, weight, stretchBuf);
  const sorted     = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  const best       = sorted[0];

  explanation.push(
    `Scores: ${sorted.slice(0, 3)
      .map(s => `${s.sizeName}(${(s.totalScore * 100).toFixed(0)}%)`)
      .join(", ")}`
  );

  // ── Phase 5: Length warning ────────────────────────────
  const heightBestIdx = [...scores].sort((a, b) => b.heightScore - a.heightScore)[0].rowIdx;
  const bodyBestIdx   = [...scores].sort((a, b) => b.widthScore  - a.widthScore)[0].rowIdx;
  const wasLengthWarning = Math.abs(heightBestIdx - bodyBestIdx) > 2;

  if (wasLengthWarning) {
    const note = lang === "Arabic"
      ? "تنبيه: هناك فارق كبير بين مقاس الطول ومقاس الجسم — قد تحتاج العباءة إلى تقصير."
      : "Note: significant height-to-body mismatch detected — the garment may need length adjustment.";
    disclaimer = note;
    explanation.push("Length warning: height-best and body-best differ by >2 sizes");
  }

  // ── Oversized+fitted disclaimer ───────────────────────
  if (fitType === "oversized" && userPreference === "fitted") {
    const note = lang === "Arabic"
      ? "هذا الطراز مصمم ليكون فضفاضاً بطبيعته — هذا هو المقاس المناسب"
      : "This style is intentionally oversized — this is the correct size for you.";
    disclaimer = disclaimer ? `${disclaimer} | ${note}` : note;
  }

  // ── Phase 6: Confidence + alternatives ────────────────
  const topScore    = best.totalScore;
  const secondScore = sorted[1]?.totalScore ?? 0;
  const gap         = topScore - secondScore;
  const clarity     = Math.min(gap * 4, 1);
  const confidence  = Math.round((topScore * 0.70 + topScore * clarity * 0.30) * 100);

  const alternatives = sorted
    .slice(1, 3)
    .filter(s => s.totalScore > 0.30)
    .map(s => s.sizeName);

  return {
    recommended:      best.sizeName,
    recommendedIdx:   best.rowIdx,
    alternatives,
    confidence,
    explanation,
    disclaimer,
    wasLengthWarning,
    estimatedBody:    rawBody,
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

  // ── Parse body ─────────────────────────────────────────
  let tag: string,
      answers: Record<string, string>,
      stock_info: Record<string, number> | null,
      lang: string,
      user_preference: string;
  try {
    const body      = await req.json();
    tag              = body.tag;
    answers          = body.answers;
    stock_info       = body.stock_info || null;
    user_preference  = (body.user_preference || "regular") as string;
    const langRaw    = (body.lang || "ar").toLowerCase();
    lang             = (langRaw.startsWith("ar") || langRaw === "arabic") ? "Arabic" : "English";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  if (!tag || !answers) {
    return NextResponse.json({ error: "tag and answers required" }, { status: 400, headers: CORS });
  }

  // ══════════════════════════════════════════════════════
  // LAYER 1 — Domain Validation
  // ══════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════
  // LAYER 2 — Rate Limiting
  // ══════════════════════════════════════════════════════
  const { success, limit, remaining } = await ratelimit.limit(merchantId);
  if (!success) {
    return NextResponse.json(
      { error: lang === "Arabic" ? "الكثير من الطلبات — حاول بعد دقيقة" : "Too many requests — try again in a minute" },
      { status: 429, headers: { ...CORS, "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  // ══════════════════════════════════════════════════════
  // LAYER 3 — Fetch Size Chart
  // ══════════════════════════════════════════════════════
  const { data: category } = await supabase
    .from("categories")
    .select("size_chart, name, fit_type, fabric_stretch_level, fabric_stretchy")
    .eq("merchant_id", merchantId)
    .ilike("tag", tag)
    .single();

  if (!category?.size_chart) {
    return NextResponse.json({ error: `No category for tag: ${tag}` }, { status: 404, headers: CORS });
  }

  const sizeChart = category.size_chart as SizeChart;
  const fitType   = (category.fit_type as string) || "regular";

  // fabric_stretch_level with backward-compat fallback
  const rawLevel = category.fabric_stretch_level as number | null;
  const fabricStretchLevel: FabricStretchLevel =
    rawLevel === 0 || rawLevel === 1 || rawLevel === 2
      ? rawLevel
      : (category.fabric_stretchy ? 1 : 0);

  // ══════════════════════════════════════════════════════
  // LAYER 4 — Scoring Engine
  // ══════════════════════════════════════════════════════
  const result = calculateSize({
    sizeChart,
    height:             Number(answers.height  || 0),
    weight:             Number(answers.weight  || 0),
    shoulders:          answers.shoulders      || "average",
    belly:              answers.belly          || "average",
    fitType,
    userPreference:     user_preference,
    lang,
    fabricStretchLevel,
  });

  let sizeName  = result.recommended;
  let finalIdx  = result.recommendedIdx;
  const { alternatives, confidence, explanation, wasLengthWarning } = result;
  let disclaimer = result.disclaimer;
  const { chest, waist, hips } = result.estimatedBody;

  console.log(
    `[${timestamp}] size: "${sizeName}" | confidence: ${confidence}% | alts: [${alternatives.join(", ")}]` +
    `${wasLengthWarning ? " | length-warning" : ""} | ${explanation[0]}`
  );

  // ── Phase 7: Stock-aware next best (both directions) ──
  let finalStatus = "available";
  let isNextBest  = false;
  const idealSizeName = sizeName;

  if (stock_info && Object.keys(stock_info).length > 0) {
    const primaryEntry     = Object.entries(stock_info).find(([k]) => sizesMatch(k, sizeName));
    const primaryAvailable = primaryEntry && Number(primaryEntry[1]) > 0;

    if (!primaryAvailable) {
      finalStatus = "out_of_stock";

      // Score-sorted candidates from both adjacent sizes
      const allScores = scoreAllSizes(sizeChart, result.estimatedBody, Number(answers.height || 0), Number(answers.weight || 0), STRETCH_BUFFER[fabricStretchLevel]);
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

  // ══════════════════════════════════════════════════════
  // LAYER 5 — AI: Generate reasoning text only
  // ══════════════════════════════════════════════════════
  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as Range | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const reasoningPrompt = `A customer needs a size recommendation. The system already chose the size — write a friendly explanation only.

CRITICAL: NEVER suggest a different size than "${sizeName}". Do NOT contradict the system.

DECISION:
- Recommended size: ${sizeName} (confidence: ${confidence}%)
- Alternatives considered: ${alternatives.join(", ") || "none"}
- Fit type: ${fitType}
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
