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
  let tag: string, gender: string, height: number,
      bust: number, waist: number, hip: number,
      shoulderOffset: number, preference: string;
  try {
    const body    = await req.json();
    tag           = body.tag;
    gender        = String(body.gender        ?? "female");
    height        = Number(body.height        ?? 0);
    bust          = Number(body.bust          ?? 0);
    waist         = Number(body.waist         ?? 0);
    hip           = Number(body.hip           ?? 0);
    shoulderOffset = Number(body.shoulder_offset ?? 0);
    preference    = String(body.preference    ?? "regular");
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
    .select("size_chart, name, niche, fabric_type")
    .eq("merchant_id", merchant.id)
    .ilike("tag", tag)
    .single();

  if (!category?.size_chart) {
    return NextResponse.json(
      { error: `No category with tag: ${tag}` },
      { status: 404, headers: CORS }
    );
  }

  const sizeChart  = category.size_chart as SizeChart;
  const fabricType = String(category.fabric_type ?? "semi");

  if (![-2, 0, 2].includes(shoulderOffset)) shoulderOffset = 0;

  // ── Calculate ──────────────────────────────────────────────────────────────
  const result = calculateSize({
    niche:           String(category.niche ?? ""),
    gender:          gender as "female" | "male",
    height,
    bust,
    waist,
    hip,
    shoulder_offset: shoulderOffset as -2 | 0 | 2,
    preference:      preference as "slim" | "regular" | "loose",
    fabric_type:     fabricType as "stretch" | "semi" | "rigid",
    size_chart:      sizeChart.rows,
  });

  log("info", "size_calculated", {
    tag,
    size:       result.size,
    confidence: result.confidence,
    merchantId: merchant.id,
  });

  return NextResponse.json({
    size:         result.size,
    confidence:   result.confidence,
    alternatives: result.alternatives,
    body_shape:   result.body_shape,
  }, { headers: CORS });
}
