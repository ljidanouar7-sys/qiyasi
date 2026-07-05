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

  return new Response("OK", { status: 200 });
}
