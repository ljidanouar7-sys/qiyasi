import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { calculateSize } from "@/lib/sizingAlgorithm";
import type { SizeChart } from "@/lib/globalSizeCharts";
import { log } from "@/lib/logger";
import { redis } from "@/lib/rate-limit";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ratelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(50, "1 m"),
  analytics: true,
  prefix:    "qiyasi_rl",
});

// ── CORS ───────────────────────────────────────────────────────────────────────

function normalizeOrigin(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
  }
}

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

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawOrigin        = req.headers.get("origin") || req.headers.get("referer") || "";
  const normalizedOrigin = normalizeOrigin(rawOrigin);
  const CORS             = corsHeaders(rawOrigin);

  try {
    // ── Parse body ─────────────────────────────────────────────────────────────
    let tag: string, height: number, weight: number,
        katif: string, sadr: string, khasr: string, warek: string;
    try {
      const body = await req.json();
      tag    = String(body.tag ?? "").toLowerCase().trim();
      height = Number(body.height ?? 0);
      weight = Number(body.weight ?? 0);
      katif  = String(body.katif ?? body.shoulders ?? "normal");
      sadr   = String(body.sadr  ?? body.chest     ?? "normal");
      khasr  = String(body.khasr ?? body.waist     ?? "normal");
      warek  = String(body.warek ?? body.hips      ?? "normal");
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
    }

    if (!tag) {
      return NextResponse.json({ error: "tag required" }, { status: 400, headers: CORS });
    }

    // ── Input validation ───────────────────────────────────────────────────────
    if (!Number.isFinite(height) || height < 100 || height > 220) {
      log("warn", "invalid_input", { field: "height", value: height });
      return NextResponse.json({ error: "height must be between 100 and 220 cm" }, { status: 400, headers: CORS });
    }
    if (!Number.isFinite(weight) || weight < 30 || weight > 250) {
      log("warn", "invalid_input", { field: "weight", value: weight });
      return NextResponse.json({ error: "weight must be between 30 and 250 kg" }, { status: 400, headers: CORS });
    }

    // ── Merchant cache (domain → merchantId + status, TTL 1h) ─────────────────
    const merchantCacheKey = `merchant:v1:${normalizedOrigin}`;
    let merchantId: string | undefined;
    let merchantStatus: string | undefined;

    const cachedMerchant = await redis.get(merchantCacheKey);
    if (cachedMerchant) {
      try {
        const m = typeof cachedMerchant === "string"
          ? JSON.parse(cachedMerchant)
          : cachedMerchant as { id: string; status: string };
        merchantId = m.id;
        merchantStatus = m.status;
      } catch {
        await redis.del(merchantCacheKey);
      }
    }

    if (!merchantId || !merchantStatus) {
      const { data: domainRow } = await supabase
        .from("merchant_domains").select("user_id")
        .eq("domain", normalizedOrigin).single();
      if (!domainRow) {
        log("warn", "domain_rejected", { domain: normalizedOrigin });
        return NextResponse.json({ error: "Unauthorized domain" }, { status: 403, headers: CORS });
      }
      const { data: merchant } = await supabase
        .from("merchants").select("id, status")
        .eq("user_id", domainRow.user_id).single();
      if (!merchant) {
        return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });
      }
      merchantId = merchant.id;
      merchantStatus = merchant.status;
      await redis.set(merchantCacheKey, JSON.stringify({ id: merchantId, status: merchantStatus }), { ex: 3600 });
    }

    if (merchantStatus !== "active") {
      log("warn", "merchant_blocked", { domain: normalizedOrigin });
      return NextResponse.json({ error: "Service unavailable" }, { status: 403, headers: CORS });
    }

    // ── Rate limit + Category fetch in parallel ────────────────────────────────
    const [{ success, limit, remaining }, categoryResult] = await Promise.all([
      ratelimit.limit(merchantId as string),
      supabase.from("categories").select("size_chart, niche")
        .eq("merchant_id", merchantId!).eq("tag", tag).single(),
    ]);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests — try again in a minute" },
        { status: 429, headers: { ...CORS, "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    const category = categoryResult.data;
    if (!category?.size_chart) {
      return NextResponse.json({ error: "Category not found" }, { status: 404, headers: CORS });
    }

    const sizeChart = category.size_chart as SizeChart;
    const niche     = String(category.niche ?? "");

    // ── Bias per-category (Redis cache TTL=1h) ────────────────────────────────
    const biasCacheKey = `bias:v1:${merchantId}:${niche}`;
    let biasValue = 0;
    const cachedBias = await redis.get(biasCacheKey);
    if (cachedBias != null) {
      biasValue = Number(cachedBias);
    } else {
      const { data: biasRow } = await supabase
        .from("size_bias")
        .select("bias_value")
        .eq("merchant_id", merchantId!)
        .eq("category", niche)
        .maybeSingle();
      biasValue = Number(biasRow?.bias_value ?? 0);
      await redis.set(biasCacheKey, String(biasValue), { ex: 3600 });
    }

    // ── Cache (keyed with bias so stale results don't survive a bias update) ──
    const cacheKey = `size:v9:${merchantId}:${tag}:${niche}:${height}:${weight}:${katif}:${sadr}:${khasr}:${warek}:${biasValue}`;
    const cached   = await redis.get(cacheKey);
    if (cached) {
      try {
        const data = typeof cached === "string" ? JSON.parse(cached) : cached;
        return NextResponse.json(data, { headers: CORS }); // cache hit — no rec_id
      } catch {
        // corrupted cache — fall through
      }
    }

    // ── Calculate ──────────────────────────────────────────────────────────────
    const result = calculateSize({
      niche, height, weight,
      katif, sadr, khasr, warek,
      size_chart: sizeChart.rows,
      bias:       biasValue,
    });

    log("info", "size_calculated", { domain: normalizedOrigin, merchantId, size: result.size });

    // ── Log customer + recommendation (await — needed for rec_id) ─────────────
    let recId: string | null = null;
    try {
      const { data: customer } = await supabase
        .from("customers")
        .insert({ merchant_id: merchantId!, height, weight })
        .select("customer_id").single();

      if (customer) {
        const { data: product } = await supabase
          .from("products")
          .select("product_id")
          .eq("merchant_id", merchantId!)
          .eq("category", niche)
          .eq("size", result.size)
          .maybeSingle();

        const { data: rec } = await supabase
          .from("recommendations")
          .insert({
            customer_id:      customer.customer_id,
            product_id:       product?.product_id ?? null,
            category:         niche,        // دائماً متاح للـ feedback
            recommended_size: result.size,
            source:           "anthropometric",
          })
          .select("rec_id").single();

        recId = rec?.rec_id ?? null;
      }
    } catch { /* لا نكسر الـ response إيلا فشل التسجيل */ }

    // ── Cache result WITHOUT rec_id ────────────────────────────────────────────
    const cacheBody = {
      size:         result.size,
      status:       result.status,
      alternatives: result.alternatives,
    };
    await redis.set(cacheKey, JSON.stringify(cacheBody), { ex: 3600 });

    return NextResponse.json({ ...cacheBody, rec_id: recId }, { headers: CORS });

  } catch (err) {
    log("error", "unhandled_error", { error: String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}
