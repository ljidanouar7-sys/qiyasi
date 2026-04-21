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
  const apiKey = new URL(req.url).searchParams.get("apiKey");

  if (!apiKey) {
    return NextResponse.json({ error: "apiKey required" }, { status: 400, headers: CORS });
  }

  // Verify API key
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("merchant_id, is_active")
    .eq("key", apiKey)
    .single();

  if (!keyRow?.is_active) {
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 403, headers: CORS });
  }

  // Return all category tags for this merchant (lightweight — no chart data)
  const { data: categories } = await supabase
    .from("categories")
    .select("tag, name")
    .eq("merchant_id", keyRow.merchant_id)
    .not("tag", "is", null);

  return NextResponse.json(
    { tags: (categories || []).map(c => ({ tag: c.tag, name: c.name })) },
    { headers: CORS }
  );
}
