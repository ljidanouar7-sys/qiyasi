import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// service role — يتجاوز RLS للكتابة من الـ webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";

  // التحقق من signature الـ Paddle قبل أي معالجة
  let event;
  try {
    event = await paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const data = event.data as Record<string, any>;

  // اشتراك جديد مفعّل
  if (event.eventType === "subscription.activated") {
    const userId = (data.customData as Record<string, string>)?.user_id;
    if (!userId) {
      return NextResponse.json({ error: "missing user_id in customData" }, { status: 400 });
    }

    await supabase.from("subscriptions").upsert(
      {
        user_id:                userId,
        paddle_customer_id:     data.customerId as string,
        paddle_subscription_id: data.id as string,
        paddle_price_id:        (data.items as any[])?.[0]?.price?.id as string,
        status:                 "active",
        current_period_end:     (data.currentBillingPeriod as any)?.endsAt as string,
        updated_at:             new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" }
    );
  }

  // تحديث الاشتراك (تغيير الخطة أو التجديد)
  if (event.eventType === "subscription.updated") {
    await supabase
      .from("subscriptions")
      .update({
        status:             data.status as string,
        paddle_price_id:    (data.items as any[])?.[0]?.price?.id as string,
        current_period_end: (data.currentBillingPeriod as any)?.endsAt as string,
        updated_at:         new Date().toISOString(),
      })
      .eq("paddle_subscription_id", data.id as string);
  }

  // إلغاء الاشتراك
  if (event.eventType === "subscription.canceled") {
    await supabase
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("paddle_subscription_id", data.id as string);
  }

  return NextResponse.json({ received: true });
}
