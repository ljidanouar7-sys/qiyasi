import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { makeRatelimit, getClientIp } from "@/lib/rate-limit";
import { log, redactEmail } from "@/lib/logger";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const APP_URL        = process.env.NEXT_PUBLIC_APP_URL;
const WEBHOOK_SECRET = process.env.SUBSCRIPTION_WEBHOOK_SECRET;

const ratelimit = makeRatelimit(20, "1 m", "qiyasi_webhook");

function verifyWebhookSecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = await ratelimit.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (!APP_URL) {
    log("error", "webhook_received", { action: "misconfiguration", reason: "NEXT_PUBLIC_APP_URL not set" });
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // ── Security: verify webhook secret ───────────────────────
  const secret = req.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || !verifyWebhookSecret(secret, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────
  let email: string, store_name: string, subscription_provider: string;
  try {
    const body         = await req.json();
    email                 = (body.email || "").toLowerCase().trim();
    store_name            = (body.store_name || "متجري").trim().slice(0, 100);
    subscription_provider = (body.subscription_provider || "paddle").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // ── Check if merchant already exists ──────────────────────
  const { data: existing } = await admin
    .from("merchants")
    .select("id, user_id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    // Update existing merchant to paid/active
    await admin.from("merchants").update({
      subscription_status:   "active",
      subscription_provider,
      status:                "active",
    }).eq("id", existing.id);

    // Activate the users record if user is already linked
    if (existing.user_id) {
      await admin.from("users").upsert(
        { id: existing.user_id, status: "active", plan: "pro" },
        { onConflict: "id" }
      );
    }

    log("info", "webhook_received", { action: "updated", email: redactEmail(email) });
    return NextResponse.json({ success: true, action: "updated" });
  }

  // ── New merchant: create auth user + send invite email ────
  const { data: invite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${APP_URL}/welcome` }
  );

  if (inviteErr || !invite?.user) {
    log("error", "webhook_received", { action: "invite_failed", email: redactEmail(email), error: inviteErr?.message });
    return NextResponse.json({ error: inviteErr?.message || "Failed to create user" }, { status: 500 });
  }

  const userId = invite.user.id;

  // ── Check if a merchant already exists with this user_id ──
  const { data: existingByUserId } = await admin
    .from("merchants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingByUserId) {
    // Auth user existed before — just update the merchant record
    await admin.from("merchants").update({
      subscription_status:   "active",
      subscription_provider,
      status:                "active",
      store_name,
    }).eq("id", existingByUserId.id);
  } else {
    // ── Insert new merchant record ─────────────────────────
    const { error: merchantErr } = await admin.from("merchants").insert({
      email,
      store_name,
      user_id:                userId,
      status:                 "active",
      invitation_accepted_at: new Date().toISOString(),
      subscription_status:    "active",
      subscription_provider,
    });

    if (merchantErr) {
      log("error", "webhook_received", { action: "insert_failed", email: redactEmail(email), error: merchantErr.message });
      return NextResponse.json({ error: merchantErr.message }, { status: 500 });
    }
  }

  // ── Create users record (controls dashboard access) ───────
  await admin.from("users").upsert(
    { id: userId, status: "active", plan: "pro" },
    { onConflict: "id" }
  );

  log("info", "webhook_received", { action: "created", email: redactEmail(email), userId });
  return NextResponse.json({ success: true, action: "created" });
}
