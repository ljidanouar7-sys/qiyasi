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

    console.log("[calculate-size] answers:", JSON.stringify(answers));
    console.log("[calculate-size] hasClientChart:", !!clientSizeChart, "| categoryId:", categoryId);

    if (!answers) {
      return NextResponse.json({ error: "answers required" }, { status: 400, headers: CORS });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("[calculate-size] GOOGLE_AI_API_KEY missing!");
      return NextResponse.json({ error: "AI not configured" }, { status: 500, headers: CORS });
    }

    // Use client-provided chart first, fallback to DB
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

    if (!sizeChart || !sizeChart.rows?.length) {
      console.error("[calculate-size] No size chart available");
      return NextResponse.json({ error: "Size chart not found" }, { status: 404, headers: CORS });
    }

    // Extract valid size names exactly as stored
    const validSizes = sizeChart.rows.map(r => String(r.size));
    console.log("[calculate-size] Valid sizes:", validSizes.join(", "));

    // Build readable chart table
    const chartTable = sizeChart.rows.map(row => {
      const cells = sizeChart!.columns.map(col => {
        const cell = row[col.id] as { min: number; max: number } | undefined;
        const range = cell ? `${cell.min}–${cell.max}` : "—";
        return `${col.label}=${range}`;
      });
      return `"${row.size}" → ${cells.join(", ")}`;
    }).join("\n");

    const shouldersMap: Record<string, string> = { wide: "عريضة", average: "متوسطة", narrow: "ضيقة" };
    const legsMap: Record<string, string>      = { long: "طويلة", average: "متوسطة", short: "قصيرة" };
    const bellyMap: Record<string, string>     = { flat: "مسطحة", average: "متوسطة", big: "كبيرة" };

    const prompt = `You are a professional Abaya tailor. Choose the correct size for this customer.

VALID SIZES (copy one of these exactly — no changes):
${validSizes.map(s => `  "${s}"`).join("\n")}

CUSTOMER:
- Height: ${answers.height} cm
- Weight: ${answers.weight} kg
- Shoulders: ${shouldersMap[answers.shoulders] || answers.shoulders}
- Legs: ${legsMap[answers.legs] || answers.legs}
- Belly: ${bellyMap[answers.belly] || answers.belly}

SIZE CHART:
${chartTable}

RULES:
1. Match height AND weight to the chart ranges above.
2. If weight and height suggest different sizes → choose the size that fits the WEIGHT (abayas must not be tight).
3. If the customer is between two sizes → choose the LARGER size.
4. If belly is "كبيرة" or shoulders are "عريضة" → go one size UP.
5. Your answer must be EXACTLY one of the valid sizes listed above. Copy it character by character.

THINKING:
- Height ${answers.height} fits: (check chart)
- Weight ${answers.weight} fits: (check chart)
- Weight-based size: ?
- Body adjustments: ?
- FINAL SIZE:`;

    console.log("[calculate-size] Chart table:\n" + chartTable);
    console.log("[calculate-size] Calling Gemini...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.0, maxOutputTokens: 50 },
    });

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text().trim();
    console.log("[calculate-size] Gemini raw:", rawResponse);

    // Extract last line (after FINAL SIZE:) or first valid match
    const lines = rawResponse.split("\n").map(l => l.trim()).filter(Boolean);
    let size = "";

    // Try to find exact match first
    for (const line of [...lines].reverse()) {
      const match = validSizes.find(s => line.includes(s));
      if (match) { size = match; break; }
    }

    // Fuzzy match: normalize spaces/slashes
    if (!size) {
      const normalize = (s: string) => s.replace(/\s/g, "").toLowerCase();
      const lastLine = lines[lines.length - 1] || "";
      size = validSizes.find(s => normalize(lastLine).includes(normalize(s))) || "";
    }

    // Last resort: first valid size in raw response
    if (!size) {
      size = validSizes.find(s => rawResponse.includes(s)) || "";
    }

    console.log("[calculate-size] Final size:", size || "NOT FOUND — returning error");

    if (!size) {
      return NextResponse.json({ error: "AI returned invalid size" }, { status: 422, headers: CORS });
    }

    return NextResponse.json({ size }, { headers: CORS });

  } catch (err) {
    console.error("[calculate-size] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500, headers: CORS });
  }
}
