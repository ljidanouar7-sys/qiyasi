import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { calculateSize } from "@/lib/sizingAlgorithm";
import type { SizeChart } from "@/lib/globalSizeCharts";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin":  process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

  // ── Parse body ─────────────────────────────────────────────────────────────
  let tag: string, height: number, weight: number,
      shoulders: string, belly: string, preference: string;
  try {
    const body  = await req.json();
    tag         = body.tag;
    height      = Number(body.height     ?? 0);
    weight      = Number(body.weight     ?? 0);
    shoulders   = String(body.shoulders  ?? "normal");
    belly       = String(body.belly      ?? "average");
    preference  = String(body.preference ?? "regular");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  if (!tag) {
    return NextResponse.json({ error: "tag required" }, { status: 400, headers: CORS });
  }

  // ── Find merchant ──────────────────────────────────────────────────────────
  const { data: merchant } = await admin
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });

  // ── Fetch size chart ───────────────────────────────────────────────────────
  const { data: category } = await admin
    .from("categories")
    .select("size_chart, niche")
    .eq("merchant_id", merchant.id)
    .ilike("tag", tag)
    .single();

  if (!category?.size_chart) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404, headers: CORS }
    );
  }

  const sizeChart = category.size_chart as SizeChart;

  // ── Calculate ──────────────────────────────────────────────────────────────
  const result = calculateSize({
    niche:      String(category.niche ?? ""),
    height,
    weight,
    shoulders,
    belly,
    preference: preference as "slim" | "regular" | "loose",
    size_chart: sizeChart.rows,
  });

  log("info", "size_calculated", {
    tag,
    size:       result.size,
    merchantId: merchant.id,
  });

  return NextResponse.json({
    size:         result.size,
    status:       result.status,
    alternatives: result.alternatives,
  }, { headers: CORS });
}
