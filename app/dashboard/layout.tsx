"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// Admin guard is enforced server-side in middleware.ts
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

const navLinks = [
  { href: "/dashboard",            label: "الرئيسية",     icon: "🏠" },
  { href: "/dashboard/categories", label: "الفئات",       icon: "📐" },
  { href: "/dashboard/embed",      label: "كود التضمين",  icon: "🔗" },
  { href: "/dashboard/billing",    label: "الباقة",       icon: "⭐" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [email,      setEmail]      = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checking,   setChecking]   = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      setEmail(user.email ?? "");

      if (user.email !== ADMIN_EMAIL) {
        const { data } = await supabase.from("merchants").select("status").eq("user_id", user.id).single();
        if (data?.status !== "active") {
          await supabase.auth.signOut();
          router.replace("/blocked");
          return;
        }
      }
      setChecking(false);
    }
    check();
  }, [router]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      {/* ===== MOBILE TOP HEADER ===== */}
      <header className="lg:hidden fixed top-0 right-0 left-0 z-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-xs">ق</div>
          <span className="font-black text-slate-900">قياسي</span>
        </Link>

        {/* Hamburger button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition"
          aria-label="القائمة"
        >
          <span className="block h-0.5 w-5 bg-slate-700 rounded" />
          <span className="block h-0.5 w-5 bg-slate-700 rounded" />
          <span className="block h-0.5 w-5 bg-slate-700 rounded" />
        </button>
      </header>

      {/* ===== BACKDROP ===== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ===== SLIDE-OVER DRAWER (mobile) ===== */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-40 shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out lg:hidden
          ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <Link
            href="/dashboard"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-xs">ق</div>
            <span className="font-black text-slate-900">قياسي</span>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition min-h-[44px] ${
                pathname === l.href
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="px-4 py-2 mb-1">
            <p className="text-xs text-slate-400 truncate">{email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition min-h-[44px]"
          >
            <span>🚪</span>
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex w-60 bg-white border-l border-slate-100 flex-col fixed h-full z-10">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-xs">ق</div>
            <span className="font-black text-slate-900">قياسي</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname === l.href
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-slate-400 truncate">{email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <span>🚪</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="lg:mr-60 pt-14 lg:pt-0 p-4 lg:p-8 min-h-screen">
        {children}
      </main>

    </div>
  );
}
