import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { makeRatelimit, getClientIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const ratelimit = makeRatelimit(30, "1 m", "qiyasi_tags");

function normalizeOrigin(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
  }
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new Response(null, { headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const rawOrigin    = req.headers.get("origin") || req.headers.get("referer") || "";
  const normalOrigin = normalizeOrigin(rawOrigin);
  const CORS         = corsHeaders(rawOrigin);
  const apiKey       = new URL(req.url).searchParams.get("apiKey");

  // ── Rate limit — ip:origin combined to resist proxy pool abuse ──
  const ip         = getClientIp(req);
  const origin     = req.headers.get("origin") || req.headers.get("referer") || "unknown";
  const identifier = `${ip}:${origin}`;
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    log("warn", "rate_limit", { endpoint: "get-tags", ip, origin });
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS });
  }

  let merchantId: string | null = null;

  // ── Method 1: Domain auth (preferred) ──────────────────────
  if (normalOrigin) {
    const { data: domainRow } = await supabase
      .from("merchant_domains")
      .select("user_id")
      .eq("domain", normalOrigin)
      .single();

    if (domainRow) {
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id, status")
        .eq("user_id", domainRow.user_id)
        .single();
      if (merchant?.status === "active") merchantId = merchant.id;
    }
  }

  // ── Method 2: API key fallback ──────────────────────────────
  if (!merchantId && apiKey) {
    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("merchant_id, is_active")
      .eq("key", apiKey)
      .single();
    if (keyRow?.is_active) merchantId = keyRow.merchant_id;
  }

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403, headers: CORS });
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("tag, name")
    .eq("merchant_id", merchantId)
    .not("tag", "is", null);

  return NextResponse.json(
    { tags: (categories || []).map(c => ({ tag: c.tag, name: c.name })) },
    { headers: { ...CORS, "Cache-Control": "public, max-age=300, s-maxage=3600" } }
  );
}
