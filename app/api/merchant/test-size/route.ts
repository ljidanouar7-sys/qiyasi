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
type SizeChartColumn    = { id: string; label: string; quiz_field: string };
type SizeChartRow       = Record<string, unknown>;
type SizeChart          = { columns: SizeChartColumn[]; rows: SizeChartRow[] };
type Range              = { min: number; max: number };
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

// ── CORS (dashboard-internal) ──────────────────────────────
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ══════════════════════════════════════════════════════════
// SIZING ENGINE  (identical to calculate-size/route.ts)
// ══════════════════════════════════════════════════════════

const STRETCH_BUFFER: Record<FabricStretchLevel, number> = { 0: 0, 1: 2, 2: 4 };
const HEIGHT_FACTOR = 0.50;

function estimateBody(height: number, weight: number): BodyMeasurements {
  const bmi      = weight / Math.pow(height / 100, 2);
  const bmiDelta = bmi - 22;
  return {
    chest: Math.round((height * 0.540 + bmiDelta * 2.2) * 10) / 10,
    waist: Math.round((height * 0.440 + bmiDelta * 3.0) * 10) / 10,
    hips:  Math.round((height * 0.590 + bmiDelta * 2.0) * 10) / 10,
  };
}

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
    const gap = range.min - value;
    return Math.max(0, 0.70 - (gap / halfSpan) * 0.55);
  }

  const gap = value - adjMax;
  return Math.max(0, 0.70 - (gap / halfSpan) * 0.90);
}

function scoreAllSizes(
  sizeChart:  SizeChart,
  body:       BodyMeasurements,
  height:     number,
  weight:     number,
  stretchBuf: number
): SizeScore[] {
  const colIds      = new Set(sizeChart.columns.map(c => c.id));
  const hasBodyCols = colIds.has("ch") || colIds.has("wa") || colIds.has("hi");

  return sizeChart.rows.map((row, rowIdx) => {
    let widthScore: number;

    if (hasBodyCols) {
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
      const wRange = row["w"] as Range | undefined;
      widthScore   = wRange ? fitScore(weight, wRange, 0) : 0.5;
    }

    const hRange      = row["h"] as Range | undefined;
    const heightScore = hRange ? fitScore(height, hRange, 0) : 0.5;
    const totalScore  = widthScore * (1 - HEIGHT_FACTOR) + heightScore * HEIGHT_FACTOR;

    return { sizeName: String(row.size ?? ""), rowIdx, widthScore, heightScore, totalScore };
  });
}

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

  const rawBody    = estimateBody(height, weight);
  const shapedBody = applyBodyShape(rawBody, shoulders, belly);
  const finalBody  = applyFitPreference(shapedBody, userPreference, fitType);

  explanation.push(
    `Estimated body: chest ${rawBody.chest}cm, waist ${rawBody.waist}cm, hips ${rawBody.hips}cm`
  );

  const stretchBuf = STRETCH_BUFFER[fabricStretchLevel];
  const scores     = scoreAllSizes(sizeChart, finalBody, height, weight, stretchBuf);
  const sorted     = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  const best       = sorted[0];

  explanation.push(
    `Scores: ${sorted.slice(0, 3)
      .map(s => `${s.sizeName}(${(s.totalScore * 100).toFixed(0)}%)`)
      .join(", ")}`
  );

  const heightBestIdx    = [...scores].sort((a, b) => b.heightScore - a.heightScore)[0].rowIdx;
  const bodyBestIdx      = [...scores].sort((a, b) => b.widthScore  - a.widthScore)[0].rowIdx;
  const wasLengthWarning = Math.abs(heightBestIdx - bodyBestIdx) > 2;

  if (wasLengthWarning) {
    const note = lang === "Arabic"
      ? "تنبيه: هناك فارق كبير بين مقاس الطول ومقاس الجسم — قد تحتاج العباءة إلى تقصير."
      : "Note: significant height-to-body mismatch — the garment may need length adjustment.";
    disclaimer = note;
  }

  if (fitType === "oversized" && userPreference === "fitted") {
    const note = lang === "Arabic"
      ? "هذا الطراز مصمم ليكون فضفاضاً بطبيعته — هذا هو المقاس المناسب"
      : "This style is intentionally oversized — this is the correct size for you.";
    disclaimer = disclaimer ? `${disclaimer} | ${note}` : note;
  }

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

// ── POST ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Auth: session cookie ────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

  // ── Parse body ──────────────────────────────────────────
  let tag: string, answers: Record<string, string>, lang: string, user_preference: string;
  try {
    const body     = await req.json();
    tag             = body.tag;
    answers         = body.answers;
    user_preference = (body.user_preference || "regular") as string;
    const langRaw   = (body.lang || "ar").toLowerCase();
    lang            = (langRaw.startsWith("ar") || langRaw === "arabic") ? "Arabic" : "English";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }
  if (!tag || !answers) {
    return NextResponse.json({ error: "tag and answers required" }, { status: 400, headers: CORS });
  }

  // ── Find merchant ────────────────────────────────────────
  const { data: merchant } = await admin
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });

  // ── Fetch size chart ─────────────────────────────────────
  const { data: category } = await admin
    .from("categories")
    .select("size_chart, name, fit_type, fabric_stretch_level, fabric_stretchy")
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

  const rawLevel = category.fabric_stretch_level as number | null;
  const fabricStretchLevel: FabricStretchLevel =
    rawLevel === 0 || rawLevel === 1 || rawLevel === 2
      ? rawLevel
      : (category.fabric_stretchy ? 1 : 0);

  // ── Scoring engine ───────────────────────────────────────
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

  const { recommended: sizeName, alternatives, confidence,
          explanation, disclaimer, wasLengthWarning } = result;
  const { chest, waist, hips } = result.estimatedBody;

  console.log(
    `[test-size] tag: ${tag} | size: "${sizeName}" | confidence: ${confidence}%` +
    ` | alts: [${alternatives.join(", ")}]${wasLengthWarning ? " | length-warning" : ""}`
  );

  // ── AI: reasoning text only ───────────────────────────────
  const chartTable = sizeChart.rows.map(row => {
    const cells = sizeChart.columns.map(col => {
      const cell = row[col.id] as Range | undefined;
      return `${col.label}: ${cell ? `${cell.min}–${cell.max}` : "—"}`;
    });
    return `"${row.size}" → ${cells.join(", ")}`;
  }).join("\n");

  const reasoningPrompt = `A merchant is testing their size recommendation tool. Write a friendly explanation of the system's decision.

CRITICAL: NEVER suggest a different size than "${sizeName}". Do NOT contradict the system.

DECISION:
- Recommended size: ${sizeName} (confidence: ${confidence}%)
- Alternatives: ${alternatives.join(", ") || "none"}
- Fit type: ${fitType}
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
      console.log("[test-size] Groq reasoning:", rawResp);
      const match     = rawResp.match(/\{[\s\S]*\}/);
      const candidate = JSON.parse(match?.[0] || rawResp);
      if (candidate.message && candidate.reasoning) parsedAI = candidate;
    } catch (aiErr) {
      console.error("[test-size] AI reasoning failed — using fallback:", aiErr);
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
  }, { headers: CORS });
}
