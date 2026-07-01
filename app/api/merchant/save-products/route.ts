import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type ProductRow = {
  size:      string;
  chest_min: number;
  chest_max: number;
  waist_min?: number;
  waist_max?: number;
  hip_min?:   number;
  hip_max?:   number;
};

// ── Validation ─────────────────────────────────────────────────────────────────

function validateRows(rows: ProductRow[]): string | null {
  for (const r of rows) {
    if (!r.size) return "كل صف يجب أن يحتوي على مقاس (size)";
    if (r.chest_min >= r.chest_max)
      return `${r.size}: chest_min (${r.chest_min}) يجب أن يكون أصغر من chest_max (${r.chest_max})`;
    if (r.waist_min != null && r.waist_max != null && r.waist_min >= r.waist_max)
      return `${r.size}: waist_min (${r.waist_min}) يجب أن يكون أصغر من waist_max (${r.waist_max})`;
    if (r.hip_min != null && r.hip_max != null && r.hip_min >= r.hip_max)
      return `${r.size}: hip_min (${r.hip_min}) يجب أن يكون أصغر من hip_max (${r.hip_max})`;
  }

  const sorted = [...rows].sort((a, b) => a.chest_min - b.chest_min);
  for (let i = 0; i < sorted.length - 1; i++) {
    const curMax  = sorted[i].chest_max;
    const nextMin = sorted[i + 1].chest_min;
    if (curMax < nextMin) {
      return `فجوة بين ${sorted[i].size} (max=${curMax}) و ${sorted[i + 1].size} (min=${nextMin})`;
    }
  }

  return null;
}

// ── POST ────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let merchant_id: string, category: string, stretch: boolean, rows: ProductRow[];
  try {
    const body  = await req.json();
    merchant_id = String(body.merchant_id ?? "");
    category    = String(body.category    ?? "");
    stretch     = Boolean(body.stretch);
    rows        = Array.isArray(body.rows) ? body.rows : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!merchant_id || !category || !rows.length) {
    return NextResponse.json({ error: "merchant_id, category, and rows are required" }, { status: 400 });
  }

  // تأكد أن هاد التاجر ملك اليوزر الحالي
  const { data: merchant } = await admin
    .from("merchants").select("id")
    .eq("id", merchant_id).eq("user_id", user.id).single();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // ── Backend Validation ───────────────────────────────────────────────────────
  const validErr = validateRows(rows);
  if (validErr) return NextResponse.json({ error: validErr }, { status: 422 });

  // ── Transaction: DELETE + INSERT عبر RPC ────────────────────────────────────
  const { error: rpcErr } = await admin.rpc("save_product_sizes", {
    p_merchant_id: merchant_id,
    p_category:    category,
    p_stretch:     stretch,
    p_rows:        rows,
  });

  if (rpcErr) {
    log("error", "unhandled_error", { action: "save_product_sizes", error: rpcErr.message });
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  log("info", "size_calculated", { action: "save_products", merchant_id, category, count: rows.length });
  return NextResponse.json({ success: true });
}
