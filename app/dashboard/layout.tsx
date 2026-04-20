"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const navLinks = [
  { href: "/dashboard", label: "الرئيسية", icon: "🏠" },
  { href: "/dashboard/products", label: "المنتجات", icon: "🛍️" },
  { href: "/dashboard/categories", label: "الفئات", icon: "📐" },
  { href: "/dashboard/embed", label: "كود التضمين", icon: "🔗" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      setEmail(user.email ?? "");

      const { data } = await supabase.from("users").select("status").eq("id", user.id).single();
      if (data?.status === "inactive") {
        await supabase.auth.signOut();
        router.replace("/auth?blocked=1");
      }
    }
    check();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <div className="min-h-screen flex bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-l border-slate-100 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-xs">ق</div>
            <span className="font-black text-slate-900">قياسي</span>
          </Link>
        </div>

        {/* Nav */}
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

        {/* User + Logout */}
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

      {/* Main */}
      <main className="flex-1 mr-60 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
