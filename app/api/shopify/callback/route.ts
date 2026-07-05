import { NextRequest, NextResponse } from "next/server";
import { createClient }             from "@supabase/supabase-js";
import crypto                        from "crypto";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyHmac(params: Record<string, string>, secret: string): boolean {
  const { hmac, ...rest } = params;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join("&");
  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return digest === hmac;
}

export async function GET(req: NextRequest) {
  const url    = req.nextUrl;
  const params = Object.fromEntries(url.searchParams.entries());
  const { shop, code } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qiyasi.net";

  // 1 — تحقق من HMAC
  if (!verifyHmac(params, process.env.SHOPIFY_API_SECRET!)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!shop || !code) {
    return new Response("Missing shop or code", { status: 400 });
  }

  // 2 — بادل code بـ access_token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      client_id:     process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return new Response("Failed to get access token", { status: 500 });
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // 3 — أنشئ أو حدّث merchant
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, user_id")
    .eq("shop_domain", shop)
    .maybeSingle();

  let shopEmail = `${shop.replace(".myshopify.com", "")}@shopify.qiyasi.net`;
  let userId    = existing?.user_id as string | undefined;

  if (existing) {
    await supabase.from("merchants")
      .update({ shopify_access_token: access_token, status: "active" })
      .eq("id", existing.id);
  } else {
    // أنشئ user جديد
    const { data: authData } = await supabase.auth.admin.createUser({
      email:         shopEmail,
      password:      crypto.randomUUID(),
      email_confirm: true,
    });

    if (!authData?.user) {
      return new Response("Failed to create user", { status: 500 });
    }

    userId = authData.user.id;

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("merchants").insert({
      user_id:                userId,
      store_name:             shop.replace(".myshopify.com", ""),
      shop_domain:            shop,
      shopify_access_token:   access_token,
      status:                 "active",
      plan:                   "free",
      trial_ends_at:          trialEndsAt,
    });

    await supabase.from("merchant_domains").insert({
      domain:  shop,
      user_id: userId,
    });
  }

  // 4 — سجّل webhook app/uninstalled
  await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
    method:  "POST",
    headers: {
      "X-Shopify-Access-Token": access_token,
      "Content-Type":           "application/json",
    },
    body: JSON.stringify({
      webhook: {
        topic:   "app/uninstalled",
        address: `${appUrl}/api/shopify/webhooks`,
        format:  "json",
      },
    }),
  }).catch(() => { /* non-fatal */ });

  // 5 — أنشئ magic link وredirect للداشبورد
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type:  "magiclink",
    email: shopEmail,
    options: { redirectTo: `${appUrl}/dashboard` },
  });

  const redirectTarget = linkData?.properties?.action_link ?? `${appUrl}/auth`;
  return NextResponse.redirect(redirectTarget);
}
