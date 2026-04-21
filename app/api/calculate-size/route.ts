import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

type SizeChart = {
  columns: { id: string; label: string; quiz_field: string }[];
  rows: Record<string, unknown>[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, answers, sizeChart: clientSizeChart } = body;

    console.log("[calculate-size] Request:", { categoryId, hasClientChart: !!clientSizeChart, answers });

    if (!answers) {
      return NextResponse.json({ error: "answers required" }, { status: 400, headers: CORS });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("[calculate-size] GOOGLE_AI_API_KEY missing!");
      return NextResponse.json({ error: "AI not configured" }, { status: 500, headers: CORS });
    }

    // Use client-provided chart first (faster), fallback to DB lookup
    let sizeChart: SizeChart | null = clientSizeChart || null;
    let categoryName = "عبايات";

    if (!sizeChart && categoryId) {
      const { data: category, error } = await supabase
        .from("categories")
        .select("size_chart, name")
        .eq("id", categoryId)
        .single();

      if (error) console.error("[calculate-size] Supabase error:", error);

      if (category?.size_chart) {
        sizeChart = category.size_chart as SizeChart;
        categoryName = category.name;
      }
    }

    if (!sizeChart) {
      console.error("[calculate-size] No size chart available");
      return NextResponse.json({ error: "Size chart not found" }, { status: 404, headers: CORS });
    }

    console.log("[calculate-size] Using chart with", sizeChart.rows?.length, "sizes");

    // Build readable chart for AI
    const chartTable = sizeChart.rows.map(row => {
      const cells = sizeChart!.columns.map(col => {
        const cell = row[col.id] as { min: number; max: number } | undefined;
        return `${col.label}: ${cell ? `${cell.min}-${cell.max}` : "—"}`;
      });
      return `  • ${row.size}: ${cells.join(", ")}`;
    }).join("\n");

    const shouldersMap: Record<string, string> = { wide: "wide/عريضة", average: "average/متوسطة", narrow: "narrow/ضيقة" };
    const legsMap: Record<string, string>      = { long: "long/طويلة",  average: "average/متوسطة", short: "short/قصيرة" };
    const bellyMap: Record<string, string>     = { flat: "flat/مسطحة",  average: "average/متوسطة", big: "big/كبيرة" };

    const prompt = `You are a master Abaya tailor with 20+ years of expertise. Select the EXACT correct size from the chart below.

=== HARD RULES (no exceptions) ===
RULE 1: Use ONLY the chart below. Never use outside knowledge.
RULE 2: WEIGHT is more important than HEIGHT. If they point to different sizes, choose the size that fits the weight.
RULE 3: When in doubt between two sizes, always choose the LARGER one.
RULE 4: If belly is "big" or shoulders are "wide", go one size UP from what the measurements suggest.
RULE 5: Your response must be ONLY the size name exactly as written (e.g. "M / 54"). Zero extra words.

=== CUSTOMER ===
Height: ${answers.height} cm
Weight: ${answers.weight} kg
Shoulders: ${shouldersMap[answers.shoulders] || answers.shoulders}
Legs: ${legsMap[answers.legs] || answers.legs}
Belly: ${bellyMap[answers.belly] || answers.belly}

=== SIZE CHART (${categoryName}) ===
${chartTable}

=== CHAIN OF THOUGHT ===
Think through these steps (internally):
1. Which sizes fit the height (${answers.height} cm)?
2. Which sizes fit the weight (${answers.weight} kg)?
3. Since WEIGHT > HEIGHT, which size does the weight suggest?
4. Does belly="${answers.belly}" or shoulders="${answers.shoulders}" require going up one size?
5. Final answer: the exact size name only.

SIZE (one line, nothing else):`;

    console.log("[calculate-size] Prompt sent to Gemini:\n" + prompt);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.1, maxOutputTokens: 20 },
    });

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text().trim();
    console.log("[calculate-size] Gemini raw response:", rawResponse);

    const size = rawResponse.split("\n")[0].replace(/["""''*.،,]/g, "").trim();
    console.log("[calculate-size] Final size:", size);

    return NextResponse.json({ size }, { headers: CORS });

  } catch (err) {
    console.error("[calculate-size] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500, headers: CORS });
  }
}
