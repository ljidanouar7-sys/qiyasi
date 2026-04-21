import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag    = searchParams.get("tag");
  const apiKey = searchParams.get("apiKey");

  if (!tag || !apiKey) {
    return NextResponse.json({ error: "tag and apiKey are required" }, { status: 400, headers: CORS });
  }

  // ── 1. Verify API key ──────────────────────────────────────────
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("merchant_id, is_active")
    .eq("key", apiKey)
    .single();

  if (!keyRow?.is_active) {
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 403, headers: CORS });
  }

  const merchantId = keyRow.merchant_id;

  // ── 2. Domain verification ─────────────────────────────────────
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";

  const { data: domains } = await supabase
    .from("merchant_domains")
    .select("domain")
    .eq("user_id", merchantId);

  if (domains && domains.length > 0) {
    const isAllowed = domains.some(d => origin.includes(d.domain));
    if (!isAllowed) {
      return NextResponse.json({ error: "Domain not authorized" }, { status: 403, headers: CORS });
    }
  }

  // ── 3. Look up category by tag ─────────────────────────────────
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, tag, size_chart")
    .eq("merchant_id", merchantId)
    .eq("tag", tag)
    .single();

  if (!category) {
    return NextResponse.json({ error: "Category not found for this tag" }, { status: 404, headers: CORS });
  }

  if (!category.size_chart) {
    return NextResponse.json({ error: "Category has no size chart configured" }, { status: 422, headers: CORS });
  }

  // ── 4. Return size chart (quiz questions are fixed in the widget) ──
  return NextResponse.json(
    {
      categoryId:   category.id,
      categoryName: category.name,
      sizeChart:    category.size_chart,
    },
    { headers: CORS }
  );
}
