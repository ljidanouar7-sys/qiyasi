import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function validateToken(token: string) {
  const { data } = await admin
    .from("merchants")
    .select("id, email, store_name, invitation_expires_at, invitation_accepted_at")
    .eq("invitation_token", token)
    .maybeSingle();

  if (!data) return { error: "رابط الدعوة غير صالح", status: 404 };
  if (data.invitation_accepted_at) return { error: "هذه الدعوة مستخدمة بالفعل", status: 410 };
  if (new Date(data.invitation_expires_at) < new Date()) return { error: "انتهت صلاحية رابط الدعوة", status: 410 };

  return { data };
}

// GET — validate token and return merchant info
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token missing" }, { status: 400 });

  const result = await validateToken(token);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({
    email:      result.data!.email,
    store_name: result.data!.store_name,
  });
}

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

// POST — create user and activate merchant
export async function POST(req: NextRequest) {
  const parse = schema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });
  }
  const { token, password } = parse.data;

  const result = await validateToken(token);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const { id: merchantId, email } = result.data!;

  // Try to create auth user — if already exists, fetch and link existing one
  let userId: string;
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already")) {
      // User exists — update their password and get their ID
      const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find(u => u.email === email);
      if (!existing) return NextResponse.json({ error: "خطأ في التحقق من المستخدم" }, { status: 500 });
      // Update password for existing user
      await admin.auth.admin.updateUserById(existing.id, { password });
      userId = existing.id;
    } else {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
  } else {
    userId = authData.user.id;
  }

  // Delete any old merchant record linked to this user (from auto-trigger on signup)
  await admin.from("merchants").delete().eq("user_id", userId).neq("id", merchantId);

  // Link invitation merchant to auth user
  const { error: updateError } = await admin
    .from("merchants")
    .update({
      user_id:                userId,
      status:                 "active",
      invitation_accepted_at: new Date().toISOString(),
    })
    .eq("id", merchantId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email });
}
