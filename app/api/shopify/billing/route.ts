import { NextRequest, NextResponse } from "next/server";
import { createClient }             from "@supabase/supabase-js";
import { createServerClient }       from "@supabase/ssr";
import { cookies }                  from "next/headers";

export const runtime = "nodejs";

const PRICE = "19.00";
const PLAN_NAME = "قياسي Pro";

export async function GET(_req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qiyasi.net";

  // 1 — اقرا الـ session من cookies
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth", appUrl));
  }

  // 2 — جيب بيانات الـ merchant
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: merchant } = await supabase
    .from("merchants")
    .select("shop_domain, shopify_access_token, plan")
    .eq("user_id", user.id)
    .single();

  // إيلا مشترك بالفعل — رجّعو للداشبورد
  if (merchant?.plan === "pro") {
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  }

  // إيلا مو تاجر Shopify — رجّعو لـ upgrade عادي
  if (!merchant?.shop_domain || !merchant?.shopify_access_token) {
    return NextResponse.redirect(new URL("/dashboard/upgrade", appUrl));
  }

  const { shop_domain, shopify_access_token } = merchant;

  // 3 — أنشئ recurring charge عند Shopify
  const returnUrl =
    `${appUrl}/api/shopify/billing/confirm?shop=${encodeURIComponent(shop_domain)}`;

  const chargeRes = await fetch(
    `https://${shop_domain}/admin/api/2024-01/recurring_application_charges.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": shopify_access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name:       PLAN_NAME,
          price:      PRICE,
          return_url: returnUrl,
          trial_days: 0,
          test:       process.env.NODE_ENV !== "production",
        },
      }),
    }
  );

  if (!chargeRes.ok) {
    const errText = await chargeRes.text();
    console.error("[Shopify Billing] create charge failed:", errText);
    return NextResponse.redirect(
      new URL("/dashboard/upgrade?error=billing_failed", appUrl)
    );
  }

  const json = await chargeRes.json() as {
    recurring_application_charge?: { confirmation_url?: string };
  };
  const confirmationUrl = json?.recurring_application_charge?.confirmation_url;

  if (!confirmationUrl) {
    return NextResponse.redirect(
      new URL("/dashboard/upgrade?error=no_confirmation_url", appUrl)
    );
  }

  // 4 — وجّه التاجر لصفحة الموافقة في Shopify
  return NextResponse.redirect(confirmationUrl);
}
