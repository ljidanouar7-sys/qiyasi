import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { makeRatelimit, getClientIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";
import { calculateSize } from "@/lib/sizingAlgorithm";
import type { SizeChart } from "@/lib/globalSizeCharts";

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const ratelimit = makeRatelimit(100, "1 m", "qiyasi_widget");

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apiKey, categoryId, height, weight, shoulders, belly, preference } = body;

  if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 400 });

  // ── Rate limit ─────────────────────────────────────────────────
  const ip = getClientIp(req);
  const { success } = await ratelimit.limit(`${apiKey}:${ip}`);
  if (!success) {
    log("warn", "rate_limit", { endpoint: "widget/size", ip });
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // ── Verify API key ─────────────────────────────────────────────
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("merchant_id, is_active")
    .eq("key", apiKey)
    .single();

  if (!keyRow || !keyRow.is_active) {
    log("warn", "invalid_key", { endpoint: "widget/size" });
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 403 });
  }

  const merchantId = keyRow.merchant_id;

  // ── Verify merchant is active ──────────────────────────────────
  const { data: merchant } = await supabase
    .from("merchants")
    .select("status")
    .eq("id", merchantId)
    .single();

  if (!merchant || merchant.status !== "active") {
    log("warn", "merchant_blocked", { endpoint: "widget/size", merchantId });
    return NextResponse.json({ error: "Service unavailable" }, { status: 403 });
  }

  // ── Input validation ───────────────────────────────────────────
  const h = Number(height);
  const w = Number(weight);

  if (!Number.isFinite(h) || h < 100 || h > 220) {
    return NextResponse.json({ error: "height must be between 100 and 220 cm" }, { status: 400 });
  }
  if (!Number.isFinite(w) || w < 30 || w > 250) {
    return NextResponse.json({ error: "weight must be between 30 and 250 kg" }, { status: 400 });
  }

  // ── Get size chart scoped to this merchant's category ──────────
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const { data: cat } = await supabase
    .from("categories")
    .select("size_chart, niche")
    .eq("id", categoryId)
    .eq("merchant_id", merchantId)
    .single();

  if (!cat?.size_chart) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const sizeChart = cat.size_chart as SizeChart;

  // ── Calculate ──────────────────────────────────────────────────
  const result = calculateSize({
    niche:      String(cat.niche ?? ""),
    height:     h,
    weight:     w,
    shoulders:  String(shoulders  ?? "normal"),
    belly:      String(belly      ?? "average"),
    preference: (["slim","regular","loose"].includes(preference) ? preference : "regular") as "slim" | "regular" | "loose",
    size_chart: sizeChart.rows,
  });

  return NextResponse.json({
    size:         result.size,
    status:       result.status,
    alternatives: result.alternatives,
  });
}
