import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || "https://qiyasi.net";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const schema = z.object({
  email:      z.string().email("بريد إلكتروني غير صالح"),
  store_name: z.string().min(2, "اسم المتجر قصير جداً"),
  domain:     z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Verify admin
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate body
  const parse = schema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });
  }
  const { email, store_name, domain } = parse.data;

  // Check duplicate email
  const { data: existing } = await admin
    .from("merchants")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "هذا البريد الإلكتروني مسجّل بالفعل" }, { status: 409 });
  }

  const token    = crypto.randomUUID();
  const now      = new Date();
  const expires  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

  const { error } = await admin.from("merchants").insert({
    email,
    store_name,
    authorized_domains: domain ? [domain] : [],
    invitation_token:      token,
    invitation_sent_at:    now.toISOString(),
    invitation_expires_at: expires.toISOString(),
    status: "invited",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const link = `${APP_URL}/accept-invitation?token=${token}`;
  return NextResponse.json({ link });
}
