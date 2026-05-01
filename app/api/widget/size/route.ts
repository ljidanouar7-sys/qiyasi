import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { makeRatelimit, getClientIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const ratelimit = makeRatelimit(100, "1 m", "qiyasi_widget");

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apiKey, height, weight, shoulders, belly, hips, categoryId } = body;

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

  // ── Get size chart scoped to this merchant's category ──────────
  let sizeData: { columns: string[]; rows: { size: string; [k: string]: string }[] } | null = null;

  if (categoryId) {
    // Query categories.size_chart directly — tenant isolation enforced by merchant_id
    const { data: cat } = await supabase
      .from("categories")
      .select("size_chart")
      .eq("id", categoryId)
      .eq("merchant_id", merchantId)
      .single();

    if (cat?.size_chart) sizeData = cat.size_chart;
  }

  // ── Calculate size ─────────────────────────────────────────────
  const h   = Number(height) || 165;
  const w   = Number(weight) || 70;
  const bmi = w / Math.pow(h / 100, 2);

  let score = 0;
  if (bmi < 18.5)      score = 0;
  else if (bmi < 23)   score = 1;
  else if (bmi < 27)   score = 2;
  else                 score = 3;

  if (shoulders === "wide")    score += 0.5;
  else if (shoulders === "narrow") score -= 0.5;
  if (belly === "big")         score += 0.5;
  else if (belly === "flat")   score -= 0.25;
  if (hips === "wide")         score += 0.5;
  else if (hips === "narrow")  score -= 0.25;

  const index = Math.min(3, Math.max(0, Math.round(score)));

  let size = "M";
  if (sizeData?.rows?.length) {
    const row = sizeData.rows[index] ?? sizeData.rows[sizeData.rows.length - 1];
    size = row.size;
  } else {
    size = ["S", "M", "L", "XL"][index];
  }

  return NextResponse.json({ size, merchantId });
}
