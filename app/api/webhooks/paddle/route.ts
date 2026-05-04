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
const PADDLE_API_KEY = process.env.PADDLE_API_KEY!;
const PADDLE_API_BASE = process.env.PADDLE_API_BASE ?? "https://sandbox-api.paddle.com";

function verifyPaddleSignature(rawBody: string, header: string | null): boolean {
  if (!header || !WEBHOOK_SECRET) return false;
  try {
    const parts: Record<string, string> = {};
    for (const part of header.split(";")) {
      const [k, v] = part.split("=");
      if (k && v) parts[k.trim()] = v.trim();
    }
    const ts       = parts["ts"];
    const h1       = parts["h1"];
    if (!ts || !h1) return false;
    const signed   = `${ts}:${rawBody}`;
    const expected = createHmac("sha256", WEBHOOK_SECRET).update(signed).digest("hex");
    return timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expected, "hex"));
  } catch { return false; }
}

async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const res = await fetch(`${PADDLE_API_BASE}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${PADDLE_API_KEY}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data?.email as string) ?? null;
  } catch { return null; }
}

async function findMerchantByEmail(email: string): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const user = data?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const { data: merchant } = await admin
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .single();
    return merchant?.id ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
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

  const statusMap: Record<string, string> = {
    "subscription.activated": "pro",
    "subscription.updated":   "pro",
    "subscription.resumed":   "pro",
    "subscription.canceled":  "free",
    "subscription.past_due":  "free",
  };

  if (!(event_type in statusMap)) {
    return NextResponse.json({ ok: true });
  }

  const customData = (data?.custom_data as Record<string, string>) ?? {};
  let merchantId   = customData.merchant_id as string | undefined;

  // If no merchant_id in customData (e.g. subscribed from public pricing page),
  // look up the merchant using the Paddle customer's email
  if (!merchantId) {
    const customerId = data.customer_id as string | undefined;
    if (customerId) {
      const email = await getCustomerEmail(customerId);
      if (email) {
        merchantId = (await findMerchantByEmail(email)) ?? undefined;
        if (!merchantId) {
          log("warn", "paddle_webhook", { event_type, customerId, note: "no merchant found for email" });
        }
      }
    }
  }

  if (merchantId) {
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
