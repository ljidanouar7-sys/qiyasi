import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { log } from "@/lib/logger";

export async function middleware(request: NextRequest) {
  const response  = NextResponse.next();
  const pathname  = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // ── Admin route — server-side guard ───────────────────────────
  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      log("warn", "admin_access", { email: user.email, path: pathname, blocked: true });
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    log("info", "admin_access", { email: user.email, path: pathname, blocked: false });
  }

  // ── Dashboard routes — merchant status + onboarding ───────────
  // Guard /welcome before all redirect logic to prevent redirect loops
  if (pathname === "/welcome") return response;

  if (pathname.startsWith("/dashboard")) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (user.email !== adminEmail) {
      const { data: merchant } = await supabase
        .from("merchants")
        .select("store_name, status")
        .eq("user_id", user.id)
        .single();

      if (!merchant || merchant.status !== "active") {
        log("warn", "merchant_blocked", { userId: user.id, path: pathname });
        return NextResponse.redirect(new URL("/blocked", request.url));
      }

      if (!merchant.store_name || merchant.store_name === "متجري") {
        return NextResponse.redirect(new URL("/welcome", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/admin", "/welcome"],
};
