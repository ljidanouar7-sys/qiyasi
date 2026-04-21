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

export async function POST(req: NextRequest) {
  try {
    const { categoryId, answers } = await req.json();
    console.log("[calculate-size] Request received:", { categoryId, answers });

    if (!categoryId || !answers) {
      return NextResponse.json({ error: "categoryId and answers are required" }, { status: 400, headers: CORS });
    }

    // Check API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("[calculate-size] GOOGLE_AI_API_KEY is missing!");
      return NextResponse.json({ error: "AI service not configured" }, { status: 500, headers: CORS });
    }
    console.log("[calculate-size] API key found, length:", apiKey.length);

    // Fetch size chart from Supabase
    const { data: category, error: dbError } = await supabase
      .from("categories")
      .select("size_chart, name")
      .eq("id", categoryId)
      .single();

    if (dbError) {
      console.error("[calculate-size] Supabase error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500, headers: CORS });
    }

    if (!category?.size_chart) {
      console.error("[calculate-size] No size chart found for categoryId:", categoryId);
      return NextResponse.json({ error: "Size chart not found" }, { status: 404, headers: CORS });
    }

    console.log("[calculate-size] Category found:", category.name);

    const sizeChart = category.size_chart as {
      columns: { id: string; label: string; quiz_field: string }[];
      rows: Record<string, unknown>[];
    };

    // Build a clean, readable size chart table for the AI
    const colLabels = sizeChart.columns.map(c => c.label);
    const colQuizFields = sizeChart.columns.map(c => c.quiz_field || "display_only");

    const chartTable = sizeChart.rows.map(row => {
      const cells = sizeChart.columns.map(col => {
        const cell = row[col.id] as { min: number; max: number } | undefined;
        return cell ? `${cell.min}-${cell.max}` : "—";
      });
      return `  - Size ${row.size}: ${sizeChart.columns.map((col, i) => `${col.label}=${cells[i]}`).join(", ")}`;
    }).join("\n");

    // Map card answers to descriptive Arabic
    const shouldersMap: Record<string, string> = { wide: "wide (عريضة)", average: "average (متوسطة)", narrow: "narrow (ضيقة)" };
    const legsMap: Record<string, string>     = { long: "long (طويلة)", average: "average (متوسطة)", short: "short (قصيرة)" };
    const bellyMap: Record<string, string>    = { flat: "flat (مسطحة)", average: "average (متوسطة)", big: "big/round (كبيرة)" };

    const prompt = `You are a professional Abaya tailor with 20+ years of experience. Your ONLY job is to select the EXACT correct size from the provided size chart for this customer.

=== HARD CONSTRAINTS (MUST follow — no exceptions) ===
1. ONLY use the provided size chart below. NEVER use your general knowledge about sizes.
2. ALWAYS prioritize WEIGHT over HEIGHT when they suggest different sizes. Abayas must not be tight around the body.
3. If the customer is between two sizes, ALWAYS choose the LARGER size for comfort.
4. If the customer has a "big" belly or "wide" shoulders, add one size up from what the chart suggests.
5. Your final answer must be ONLY the size name exactly as written in the chart (e.g., "M / 54"). Nothing else.

=== CUSTOMER MEASUREMENTS ===
- Height: ${answers.height} cm
- Weight: ${answers.weight} kg
- Shoulders: ${shouldersMap[answers.shoulders] || answers.shoulders}
- Legs: ${legsMap[answers.legs] || answers.legs}
- Belly: ${bellyMap[answers.belly] || answers.belly}

=== SIZE CHART for "${category.name}" ===
Columns: ${colLabels.join(" | ")} (quiz fields: ${colQuizFields.join(" | ")})
${chartTable}

=== YOUR REASONING PROCESS (think step by step, but only output the final size) ===
Step 1: Find which size(s) match the height (${answers.height} cm).
Step 2: Find which size(s) match the weight (${answers.weight} kg).
Step 3: If they differ, CHOOSE the size that matches the WEIGHT (higher priority).
Step 4: Apply body shape adjustments: belly="${answers.belly}", shoulders="${answers.shoulders}".
Step 5: If between sizes, go LARGER.
Step 6: Output ONLY the final size name.

FINAL ANSWER (size name only, nothing else):`;

    console.log("[calculate-size] Sending prompt to Gemini...");
    console.log("[calculate-size] Prompt:\n", prompt);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,   // Low temperature = more deterministic, less creative
        maxOutputTokens: 20, // We only need the size name
      },
    });

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text().trim();
    console.log("[calculate-size] Gemini raw response:", rawResponse);

    // Extract just the size name — take first line, remove quotes/periods
    const size = rawResponse.split("\n")[0].replace(/["""''*.]/g, "").trim();
    console.log("[calculate-size] Final size returned:", size);

    return NextResponse.json({ size }, { headers: CORS });

  } catch (err) {
    console.error("[calculate-size] Unhandled error:", err);
    return NextResponse.json({ error: "Failed to calculate size" }, { status: 500, headers: CORS });
  }
}
