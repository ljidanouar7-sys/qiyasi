import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { makeRatelimit, getClientIp, redis } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ratelimit = makeRatelimit(10, "1 m", "qiyasi_feedback");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STEP    = 0.05;

function clamp(v: number): number { return Math.min(1, Math.max(-1, v)); }

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin":  origin || "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new Response(null, { headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  const CORS   = corsHeaders(origin);

  try {
    let rec_id: string, quick_feedback: string;
    try {
      const body     = await req.json();
      rec_id         = String(body.rec_id         ?? "").trim();
      quick_feedback = String(body.quick_feedback ?? "").trim();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
    }

    if (!UUID_RE.test(rec_id)) {
      return NextResponse.json({ error: "Invalid rec_id" }, { status: 400, headers: CORS });
    }
    if (!["fit_good", "too_tight", "too_loose"].includes(quick_feedback)) {
      return NextResponse.json({ error: "Invalid feedback value" }, { status: 400, headers: CORS });
    }

    const ip = getClientIp(req);
    const { success } = await ratelimit.limit(ip);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS });

    // تحقق أن الـ rec_id موجود
    const { data: rec } = await supabase
      .from("recommendations")
      .select("rec_id, customer_id, category, recommended_size")
      .eq("rec_id", rec_id)
      .maybeSingle();

    if (!rec) return NextResponse.json({ error: "Recommendation not found" }, { status: 404, headers: CORS });

    // Idempotency — منع تكرار الـ feedback لنفس rec_id
    const { data: existing } = await supabase
      .from("outcomes")
      .select("order_id")
      .eq("rec_id", rec_id)
      .maybeSingle();

    if (existing) return NextResponse.json({ error: "Feedback already submitted" }, { status: 409, headers: CORS });

    // تحديد حقول outcome
    const outcomeMap = {
      fit_good:  { status: "kept",     return_reason: null        },
      too_tight: { status: "returned", return_reason: "too_tight" },
      too_loose: { status: "returned", return_reason: "too_loose" },
    } as const;
    const { status, return_reason } = outcomeMap[quick_feedback as keyof typeof outcomeMap];

    await supabase.from("outcomes").insert({
      rec_id,
      bought_size:   rec.recommended_size,
      status,
      return_reason,
      feedback_type: "quick_widget",
    });

    // تحديث size_bias per-category (category مخزونة مباشرة فـ recommendations)
    const category = rec.category;
    if (category) {
      const { data: customer } = await supabase
        .from("customers")
        .select("merchant_id")
        .eq("customer_id", rec.customer_id)
        .single();

      if (customer) {
        const merchantId = customer.merchant_id as string;
        const signal     = quick_feedback === "too_tight" ?  STEP
                         : quick_feedback === "too_loose" ? -STEP : 0;

        const { data: biasRow } = await supabase
          .from("size_bias")
          .select("bias_value, sample_count")
          .eq("merchant_id", merchantId)
          .eq("category", category)
          .maybeSingle();

        await supabase.from("size_bias").upsert({
          merchant_id:  merchantId,
          category,
          bias_value:   clamp((biasRow?.bias_value ?? 0) + signal),
          sample_count: (biasRow?.sample_count ?? 0) + 1,
          updated_at:   new Date().toISOString(),
        }, { onConflict: "merchant_id,category" });

        // امسح cache الـ bias باش الطلب الجاي يجيب القيمة الجديدة
        await redis.del(`bias:v1:${merchantId}:${category}`);
      }
    }

    log("info", "size_calculated", { action: "feedback", rec_id, quick_feedback });
    return NextResponse.json({ success: true }, { headers: CORS });

  } catch (err) {
    log("error", "unhandled_error", { error: String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}
