import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await req.json();
  if (!domain?.trim()) return NextResponse.json({ error: "domain required" }, { status: 400 });

  const normalized = domain.trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "")
    .toLowerCase();

  // Delete old then insert (avoids onConflict issues)
  await supabase.from("merchant_domains").delete().eq("user_id", user.id);
  const { error } = await supabase.from("merchant_domains").insert({ user_id: user.id, domain: normalized });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ domain: normalized });
}
