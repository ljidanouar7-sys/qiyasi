import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const APP_URL        = process.env.NEXT_PUBLIC_APP_URL || "https://qiyasi.net";
const WEBHOOK_SECRET = process.env.SUBSCRIPTION_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // ── Security: verify webhook secret ───────────────────────
  const secret = req.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────
  let email: string, store_name: string, subscription_provider: string;
  try {
    const body         = await req.json();
    email                 = (body.email || "").toLowerCase().trim();
    store_name            = (body.store_name || "متجري").trim();
    subscription_provider = (body.subscription_provider || "paddle").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
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

    console.log(`[subscription-webhook] Updated existing merchant: ${email}`);
    return NextResponse.json({ success: true, action: "updated" });
  }

  // ── New merchant: create auth user + send invite email ────
  const { data: invite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${APP_URL}/welcome` }
  );

  if (inviteErr || !invite?.user) {
    console.error("[subscription-webhook] inviteUserByEmail failed:", inviteErr);
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
      console.error("[subscription-webhook] Insert merchant failed:", merchantErr);
      return NextResponse.json({ error: merchantErr.message }, { status: 500 });
    }
  }

  // ── Create users record (controls dashboard access) ───────
  await admin.from("users").upsert(
    { id: userId, status: "active", plan: "pro" },
    { onConflict: "id" }
  );

  console.log(`[subscription-webhook] Created new merchant: ${email}, user_id: ${userId}`);
  return NextResponse.json({ success: true, action: "created" });
}
