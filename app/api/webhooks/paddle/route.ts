import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

function verifyPaddleSignature(rawBody: string, header: string | null): boolean {
  if (!header || !WEBHOOK_SECRET) return false;
  try {
    const parts: Record<string, string> = {};
    for (const part of header.split(";")) {
      const [k, v] = part.split("=");
      if (k && v) parts[k.trim()] = v.trim();
    }
    const ts        = parts["ts"];
    const h1        = parts["h1"];
    if (!ts || !h1) return false;
    const signed    = `${ts}:${rawBody}`;
    const expected  = createHmac("sha256", WEBHOOK_SECRET).update(signed).digest("hex");
    return timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expected, "hex"));
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("paddle-signature");

  if (!verifyPaddleSignature(rawBody, sigHeader)) {
    log("warn", "paddle_webhook", { error: "invalid signature" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: { event_type: string; data: Record<string, unknown> };
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { event_type, data } = event;
  log("info", "paddle_webhook", { event_type });

  const customData  = (data?.custom_data as Record<string, string>) ?? {};
  const merchantId  = customData.merchant_id as string | undefined;
  const statusMap: Record<string, string> = {
    "subscription.activated": "pro",
    "subscription.updated":   "pro",
    "subscription.resumed":   "pro",
    "subscription.canceled":  "free",
    "subscription.past_due":  "free",
  };

  if (event_type in statusMap && merchantId) {
    const newPlan = statusMap[event_type];
    await admin.from("merchants").update({
      plan: newPlan,
      subscription_status: newPlan === "pro" ? "active" : event_type.replace("subscription.", ""),
      subscription_provider: "paddle",
    }).eq("id", merchantId);

    log("info", "paddle_webhook", { event_type, merchantId, newPlan });
  }

  return NextResponse.json({ ok: true });
}
