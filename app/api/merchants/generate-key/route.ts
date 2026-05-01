import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/logger";

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

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  // Generate new key first — only deactivate old ones if creation succeeds
  const newKey = `ssm_${crypto.randomUUID().replace(/-/g, "")}`;

  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .insert({ merchant_id: merchant.id, key: newKey, is_active: true })
    .select("key")
    .single();

  if (error) return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });

  // Safe to deactivate old keys now that new one exists
  await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("merchant_id", merchant.id)
    .neq("key", newKey);

  log("info", "key_rotated", { merchantId: merchant.id });
  return NextResponse.json({ key: apiKey.key });
}
