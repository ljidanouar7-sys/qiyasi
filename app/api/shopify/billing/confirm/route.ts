import { NextRequest, NextResponse } from "next/server";
import { createClient }             from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qiyasi.net";
  const { searchParams } = req.nextUrl;

  const shop     = searchParams.get("shop")      ?? "";
  const chargeId = searchParams.get("charge_id") ?? "";

  if (!shop || !chargeId) {
    return NextResponse.redirect(
      new URL("/dashboard/upgrade?error=missing_params", appUrl)
    );
  }

  // 1 — جيب access_token الخاص بهذا المتجر
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, shopify_access_token")
    .eq("shop_domain", shop)
    .single();

  if (!merchant?.shopify_access_token) {
    return NextResponse.redirect(
      new URL("/dashboard/upgrade?error=merchant_not_found", appUrl)
    );
  }

  const { id: merchantId, shopify_access_token } = merchant;

  // 2 — تحقق من حالة الـ charge عند Shopify
  const chargeRes = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}.json`,
    { headers: { "X-Shopify-Access-Token": shopify_access_token } }
  );

  if (!chargeRes.ok) {
    return NextResponse.redirect(
      new URL("/dashboard/upgrade?error=charge_fetch_failed", appUrl)
    );
  }

  const { recurring_application_charge: charge } = (await chargeRes.json()) as {
    recurring_application_charge?: { status?: string };
  };

  // إيلا التاجر رفض أو الـ charge في حالة غير مقبولة
  if (charge?.status !== "accepted") {
    return NextResponse.redirect(
      new URL("/dashboard/upgrade?error=charge_declined", appUrl)
    );
  }

  // 3 — فعّل الـ charge
  const activateRes = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}/activate.json`,
    {
      method:  "POST",
      headers: {
        "X-Shopify-Access-Token": shopify_access_token,
        "Content-Type":           "application/json",
      },
    }
  );

  if (!activateRes.ok) {
    console.error("[Shopify Billing] activate failed:", await activateRes.text());
    return NextResponse.redirect(
      new URL("/dashboard/upgrade?error=activate_failed", appUrl)
    );
  }

  // 4 — حدّث الـ merchant في Supabase: plan = "pro"
  await supabase
    .from("merchants")
    .update({ plan: "pro" })
    .eq("id", merchantId);

  // 5 — رجّعو للداشبورد
  return NextResponse.redirect(new URL("/dashboard", appUrl));
}
