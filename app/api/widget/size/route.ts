import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apiKey, height, weight, shoulders, belly, hips, categoryId } = body;

  if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 400 });

  // Verify API key
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("merchant_id, is_active")
    .eq("key", apiKey)
    .single();

  if (!keyRow || !keyRow.is_active) {
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 403 });
  }

  // Try to get size chart for specific category
  let sizeData: { columns: string[]; rows: { size: string; [k: string]: string }[] } | null = null;

  if (categoryId) {
    const { data: chart } = await supabase
      .from("size_charts")
      .select("chart_data")
      .eq("category_id", categoryId)
      .single();

    if (chart?.chart_data) sizeData = chart.chart_data;
  }

  // Calculate size using BMI + body shape
  const h = Number(height) || 165;
  const w = Number(weight) || 70;
  const bmi = w / Math.pow(h / 100, 2);

  let score = 0;
  if (bmi < 18.5) score = 0;
  else if (bmi < 23) score = 1;
  else if (bmi < 27) score = 2;
  else score = 3;

  if (shoulders === "wide") score += 0.5;
  else if (shoulders === "narrow") score -= 0.5;

  if (belly === "big") score += 0.5;
  else if (belly === "flat") score -= 0.25;

  if (hips === "wide") score += 0.5;
  else if (hips === "narrow") score -= 0.25;

  const index = Math.min(3, Math.max(0, Math.round(score)));

  // Use merchant's size labels if available, else default
  let size = "M";
  if (sizeData?.rows?.length) {
    const row = sizeData.rows[index] ?? sizeData.rows[sizeData.rows.length - 1];
    size = row.size;
  } else {
    size = ["S", "M", "L", "XL"][index];
  }

  return NextResponse.json({ size, merchantId: keyRow.merchant_id });
}
