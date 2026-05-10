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
    let tag: string, gender: string, height: number,
        bust: number, waist: number, hip: number,
        shoulderOffset: number, preference: string;
    try {
      const body    = await req.json();
      tag           = body.tag;
      gender        = String(body.gender        ?? "female");
      height        = Number(body.height        ?? 0);
      bust          = Number(body.bust          ?? 0);
      waist         = Number(body.waist         ?? 0);
      hip           = Number(body.hip           ?? 0);
      shoulderOffset = Number(body.shoulder_offset ?? 0);
      preference    = String(body.preference    ?? "regular");
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
    for (const [field, val] of [["bust", bust], ["waist", waist], ["hip", hip]] as [string, number][]) {
      if (!Number.isFinite(val) || val < 50 || val > 180) {
        log("warn", "invalid_input", { field, value: val });
        return NextResponse.json({ error: `${field} must be between 50 and 180 cm` }, { status: 400, headers: CORS });
      }
    }
    if (![-2, 0, 2].includes(shoulderOffset)) shoulderOffset = 0;

    // ── Domain Validation ──────────────────────────────────────────────────────
    const { data: domainRow } = await supabase
      .from("merchant_domains")
      .select("user_id")
      .eq("domain", normalizedOrigin)
      .single();

    if (!domainRow) {
      log("warn", "domain_rejected", { domain: normalizedOrigin });
      return NextResponse.json({ error: "Unauthorized domain" }, { status: 403, headers: CORS });
    }

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, status")
      .eq("user_id", domainRow.user_id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: CORS });
    }

    if (merchant.status !== "active") {
      log("warn", "merchant_blocked", { domain: normalizedOrigin });
      return NextResponse.json({ error: "Service unavailable" }, { status: 403, headers: CORS });
    }

    const merchantId = merchant.id;

    // ── Rate Limiting ──────────────────────────────────────────────────────────
    const { success, limit, remaining } = await ratelimit.limit(merchantId);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests — try again in a minute" },
        { status: 429, headers: { ...CORS, "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    // ── Fetch Size Chart ───────────────────────────────────────────────────────
    const { data: category } = await supabase
      .from("categories")
      .select("size_chart, niche, fabric_type")
      .eq("merchant_id", merchantId)
      .ilike("tag", tag)
      .single();

    if (!category?.size_chart) {
      return NextResponse.json({ error: `No category for tag: ${tag}` }, { status: 404, headers: CORS });
    }

    const sizeChart  = category.size_chart as SizeChart;
    const niche      = String(category.niche      ?? "");
    const fabricType = String(category.fabric_type ?? "semi");

    // ── Cache ──────────────────────────────────────────────────────────────────
    const cacheKey = `size:v5:${merchantId}:${tag}:${niche}:${height}:${bust}:${waist}:${hip}:${shoulderOffset}:${preference}:${fabricType}`;
    const cached   = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return NextResponse.json(data, { headers: CORS });
    }

    // ── Calculate ──────────────────────────────────────────────────────────────
    const result = calculateSize({
      niche,
      gender:          gender as "female" | "male",
      height,
      bust,
      waist,
      hip,
      shoulder_offset: shoulderOffset as -2 | 0 | 2,
      preference:      preference as "slim" | "regular" | "loose",
      fabric_type:     fabricType as "stretch" | "semi" | "rigid",
      size_chart:      sizeChart.rows,
    });

    log("info", "size_calculated", {
      domain: normalizedOrigin,
      merchantId,
      size:       result.size,
      confidence: result.confidence,
    });

    const responseBody = {
      size:         result.size,
      confidence:   result.confidence,
      alternatives: result.alternatives,
      body_shape:   result.body_shape,
    };

    await redis.set(cacheKey, JSON.stringify(responseBody), { ex: 3600 });

    return NextResponse.json(responseBody, { headers: CORS });

  } catch (err) {
    console.error("[calculate-size] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}
