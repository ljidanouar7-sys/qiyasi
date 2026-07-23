import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    // SameSite=None required for Shopify embedded app (cross-site iframe)
    cookieOptions: {
      sameSite: "none" as const,
      secure: true,
    },
  }
);