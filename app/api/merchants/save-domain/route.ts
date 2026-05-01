import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await req.json();
  if (!domain?.trim()) return NextResponse.json({ error: "domain required" }, { status: 400 });

  // 1. Normalize — lowercase + strip protocol/www/trailing slash
  const normalized = domain.trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");

  // 2. Format validation
  if (!domainRegex.test(normalized)) {
    return NextResponse.json({ error: "صيغة الدومين غير صحيحة — مثال: mystore.com" }, { status: 400 });
  }

  // 3. Application-level uniqueness check (fast path before DB write)
  const { data: takenBy } = await supabase
    .from("merchant_domains")
    .select("user_id")
    .eq("domain", normalized)
    .maybeSingle();

  if (takenBy && takenBy.user_id !== user.id) {
    log("warn", "domain_conflict_attempt", { attemptedDomain: normalized, userId: user.id });
    return NextResponse.json({ error: "هذا الدومين مسجّل من طرف حساب آخر" }, { status: 409 });
  }

  // 4. Delete old domain for this user, then insert new one
  await supabase.from("merchant_domains").delete().eq("user_id", user.id);

  const { error } = await supabase
    .from("merchant_domains")
    .insert({ user_id: user.id, domain: normalized });

  if (error) {
    // 5. Catch DB-level UNIQUE violation (race condition protection)
    if (error.code === "23505") {
      log("warn", "domain_conflict_attempt", { attemptedDomain: normalized, userId: user.id });
      return NextResponse.json({ error: "هذا الدومين مسجّل من طرف حساب آخر" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: normalized });
}
