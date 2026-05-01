import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { originMatchesDomain } from "@/lib/domain";
import { makeRatelimit, getClientIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const supabase   = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const ratelimit  = makeRatelimit(60, "1 m", "qiyasi_quiz");

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin":  origin || "",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  return new Response(null, { headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  const CORS   = corsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const tag    = searchParams.get("tag");
  const apiKey = searchParams.get("apiKey");

  if (!tag || !apiKey) {
    return NextResponse.json({ error: "tag and apiKey are required" }, { status: 400, headers: CORS });
  }

  // ── Rate limit ─────────────────────────────────────────────────
  const ip = getClientIp(req);
  const { success } = await ratelimit.limit(`${apiKey}:${ip}`);
  if (!success) {
    log("warn", "rate_limit", { endpoint: "get-quiz", ip });
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS });
  }

  // ── Verify API key ─────────────────────────────────────────────
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("merchant_id, is_active")
    .eq("key", apiKey)
    .single();

  if (!keyRow?.is_active) {
    log("warn", "invalid_key", { endpoint: "get-quiz" });
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 403, headers: CORS });
  }

  const merchantId = keyRow.merchant_id;

  // ── Domain verification ────────────────────────────────────────
  const { data: domains } = await supabase
    .from("merchant_domains")
    .select("domain")
    .eq("user_id", merchantId);

  if (domains && domains.length > 0) {
    const isAllowed = domains.some(d => originMatchesDomain(origin, d.domain));
    if (!isAllowed) {
      log("warn", "domain_blocked", { origin, merchantId });
      return NextResponse.json({ error: "Domain not authorized" }, { status: 403, headers: CORS });
    }
  }

  // ── Look up category by tag ────────────────────────────────────
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, tag, size_chart")
    .eq("merchant_id", merchantId)
    .ilike("tag", tag)
    .single();

  if (!category) {
    return NextResponse.json({ error: "Category not found for this tag" }, { status: 404, headers: CORS });
  }

  if (!category.size_chart) {
    return NextResponse.json({ error: "Category has no size chart configured" }, { status: 422, headers: CORS });
  }

  return NextResponse.json(
    { categoryId: category.id, categoryName: category.name, sizeChart: category.size_chart },
    { headers: { ...CORS, "Cache-Control": "public, max-age=300, s-maxage=3600" } }
  );
}
