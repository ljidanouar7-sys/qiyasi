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

function normalizeOrigin(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function GET(req: NextRequest) {
  const apiKey       = new URL(req.url).searchParams.get("apiKey");
  const rawOrigin    = req.headers.get("origin") || req.headers.get("referer") || "";
  const normalOrigin = normalizeOrigin(rawOrigin);

  let merchantId: string | null = null;

  // ── Method 1: Domain auth (new, preferred) ─────────────────
  if (normalOrigin) {
    const { data: domainRow } = await supabase
      .from("merchant_domains")
      .select("user_id")
      .eq("domain", normalOrigin)
      .single();

    if (domainRow) {
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("user_id", domainRow.user_id)
        .single();
      if (merchant) merchantId = merchant.id;
    }
  }

  // ── Method 2: API key fallback (backward compat) ────────────
  if (!merchantId && apiKey) {
    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("merchant_id, is_active")
      .eq("key", apiKey)
      .single();
    if (keyRow?.is_active) merchantId = keyRow.merchant_id;
  }

  if (!merchantId) {
    return NextResponse.json({ tags: [] }, { headers: CORS });
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("tag, name")
    .eq("merchant_id", merchantId)
    .not("tag", "is", null);

  return NextResponse.json(
    { tags: (categories || []).map(c => ({ tag: c.tag, name: c.name })) },
    { headers: CORS }
  );
}
