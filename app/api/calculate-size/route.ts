import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

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

    if (!categoryId || !answers) {
      return NextResponse.json({ error: "categoryId and answers are required" }, { status: 400, headers: CORS });
    }

    // Fetch size chart from Supabase
    const { data: category } = await supabase
      .from("categories")
      .select("size_chart, name")
      .eq("id", categoryId)
      .single();

    if (!category?.size_chart) {
      return NextResponse.json({ error: "Size chart not found" }, { status: 404, headers: CORS });
    }

    const sizeChart = category.size_chart as {
      columns: { id: string; label: string; quiz_field: string }[];
      rows: Record<string, unknown>[];
    };

    // Build size chart table as readable text
    const colHeaders = sizeChart.columns.map(c => c.label).join(" | ");
    const rows = sizeChart.rows.map(row => {
      const cells = sizeChart.columns.map(col => {
        const cell = row[col.id] as { min: number; max: number } | undefined;
        return cell ? `${cell.min}-${cell.max}` : "—";
      });
      return `${row.size} | ${cells.join(" | ")}`;
    }).join("\n");

    // Map card answers to Arabic
    const shouldersMap: Record<string, string> = { wide: "عريضة", average: "متوسطة", narrow: "ضيقة" };
    const legsMap: Record<string, string> = { long: "طويلة", average: "متوسطة", short: "قصيرة" };
    const bellyMap: Record<string, string> = { flat: "مسطحة", average: "متوسطة", big: "كبيرة" };

    const prompt = `أنت خياط محترف متخصص في العبايات والملابس الطويلة النسائية. مهمتك اختيار المقاس المناسب للزبونة بدقة احترافية.

معلومات الزبونة:
- الطول: ${answers.height} سم
- الوزن: ${answers.weight} كغ
- شكل الكتفين: ${shouldersMap[answers.shoulders] || answers.shoulders}
- طول الرجلين: ${legsMap[answers.legs] || answers.legs}
- شكل البطن: ${bellyMap[answers.belly] || answers.belly}

جدول المقاسات (${category.name}):
المقاس | ${colHeaders}
${rows}

بناءً على معلومات الزبونة وجدول المقاسات، اختر المقاس الأنسب لها.
إذا كانت بين مقاسين، اختر الأكبر للراحة في الارتداء.
أجب بالمقاس فقط، مثل: L / 56
لا تكتب أي شيء آخر.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const size = result.response.text().trim();

    return NextResponse.json({ size }, { headers: CORS });

  } catch (err) {
    console.error("calculate-size error:", err);
    return NextResponse.json({ error: "Failed to calculate size" }, { status: 500, headers: CORS });
  }
}
