import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { makeRatelimit, getClientIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ratelimit = makeRatelimit(10, "1 m", "qiyasi_demo");

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let name: string, email: string, store_url: string, message: string;
  try {
    const body = await req.json();
    name      = (body.name      || "").trim();
    email     = (body.email     || "").toLowerCase().trim();
    store_url = (body.storeUrl  || "").trim();
    message   = (body.message   || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!name || !email || !store_url) {
    return NextResponse.json({ error: "name, email, and storeUrl are required" }, { status: 400 });
  }

  const { error } = await admin.from("demo_requests").insert({ name, email, store_url, message });
  if (error) {
    log("error", "webhook_received", { action: "demo_insert_failed", error: error.message });
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  log("info", "webhook_received", { action: "demo_request", email, store_url });
  return NextResponse.json({ success: true });
}
