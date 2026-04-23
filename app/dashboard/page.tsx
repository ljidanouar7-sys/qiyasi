"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase.from("users").select("plan, status").eq("id", user.id).single();
      if (data) { setPlan(data.plan); setStatus(data.status); }
    }
    load();
  }, []);

  const stats = [
    { label: "الفئات",  val: "—",                                    href: "/dashboard/categories", icon: "📐" },
    { label: "الخطة",   val: plan === "pro" ? "Pro ⭐" : "مجانية",   href: "#",                     icon: "💎" },
    { label: "الحالة",  val: status === "active" ? "مفعّل" : "موقوف", href: "#",                     icon: "✅" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 md:mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">لوحة التحكم</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">مرحباً 👋</h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1 truncate">{email}</p>
      </div>

      {status === "inactive" && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-2xl mb-6">
          ⚠️ حسابك موقوف — تواصل مع الإدارة للتفعيل.
        </div>
      )}

      {/* Stats grid — 1 col on xs, 3 cols on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-10">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 hover:border-teal-200 hover:shadow-sm transition flex sm:block items-center gap-4"
          >
            <p className="text-2xl">{s.icon}</p>
            <div>
              <p className="text-lg md:text-xl font-black text-slate-900 sm:mt-3 sm:mb-1">{s.val}</p>
              <p className="text-xs text-slate-400 font-semibold">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick start */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6">
        <h2 className="font-black text-slate-900 mb-4 md:mb-5">البداية السريعة</h2>
        <div className="space-y-3">
          {[
            { label: "أضف فئة جديدة",          href: "/dashboard/categories", icon: "📐" },
            { label: "احصل على كود التضمين",    href: "/dashboard/embed",      icon: "🔗" },
          ].map(a => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-3 p-3 md:p-4 min-h-[44px] bg-slate-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-semibold text-slate-700 transition"
            >
              <span>{a.icon}</span>
              {a.label}
              <span className="mr-auto text-slate-300">←</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
