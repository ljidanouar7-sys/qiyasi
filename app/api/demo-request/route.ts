import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { makeRatelimit, getClientIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY!);
const ratelimit = makeRatelimit(10, "1 m", "qiyasi_demo");

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let storeName: string, email: string, store_url: string, message: string;
  try {
    const body = await req.json();
    storeName = (body.storeName || body.name || "").trim();
    email     = (body.email    || "").toLowerCase().trim();
    store_url = (body.storeUrl || "").trim();
    message   = (body.message  || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!storeName || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  // حفظ في DB
  await admin.from("demo_requests").insert({ name: storeName, email, store_url, message }).throwOnError();

  // إرسال email لصاحب Qiyasi
  await resend.emails.send({
    from:    "Qiyasi <onboarding@resend.dev>",
    to:      "ljidanouar7@gmail.com",
    subject: `طلب تجربة جديد — ${storeName}`,
    html: `
      <div dir="rtl" style="font-family:sans-serif;padding:24px">
        <h2>طلب تجربة جديد 🎉</h2>
        <p><strong>اسم المتجر:</strong> ${storeName}</p>
        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
      </div>
    `,
  });

  log("info", "size_calculated", { action: "demo_request", email, storeName });
  return NextResponse.json({ success: true });
}
