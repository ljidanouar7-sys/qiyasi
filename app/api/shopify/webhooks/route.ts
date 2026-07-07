import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto           from "crypto";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") ?? "";

  // تحقق من صحة الطلب
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(body, "utf8")
    .digest("base64");

  if (digest !== hmac) {
    return new Response("Unauthorized", { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic") ?? "";

  if (topic === "app/uninstalled") {
    const { domain } = JSON.parse(body) as { domain: string };
    if (domain) {
      await supabase.from("merchants")
        .update({ status: "inactive", shopify_access_token: null })
        .eq("shop_domain", domain);
    }
  }

  if (topic === "app_subscriptions/update") {
    const shopDomain = req.headers.get("x-shopify-shop-domain") ?? "";
    const payload = JSON.parse(body) as {
      app_subscription?: { status?: string };
    };
    const subStatus = payload?.app_subscription?.status;

    if (shopDomain && subStatus) {
      if (subStatus === "ACTIVE") {
        await supabase.from("merchants")
          .update({ plan: "pro" })
          .eq("shop_domain", shopDomain);
      } else {
        // CANCELLED, DECLINED, EXPIRED, PENDING
        await supabase.from("merchants")
          .update({ plan: "free" })
          .eq("shop_domain", shopDomain);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
