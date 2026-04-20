"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "ljidanouar7@gmail.com";

type Merchant = {
  id: string;
  email: string;
  plan: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) { router.replace("/"); return; }
      const res = await fetch("/api/admin/merchants");
      if (res.ok) { const json = await res.json(); setMerchants(json.merchants); }
      setLoading(false);
    }
    load();
  }, [router]);

  async function update(id: string, body: Partial<Merchant>) {
    setUpdating(id);
    await fetch(`/api/admin/merchants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMerchants(prev => prev.map(m => m.id === id ? { ...m, ...body } : m));
    setUpdating(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400 text-sm">جاري التحميل...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">لوحة الإدارة</p>
            <h1 className="text-3xl font-black text-slate-900">إدارة التجار</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-teal-50 border border-teal-200 text-teal-700 text-sm font-bold px-4 py-2 rounded-xl">
              {merchants.length} تاجر
            </span>
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-red-600 font-semibold transition px-3 py-2"
            >
              خروج
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">الإيميل</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">الخطة</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">الحالة</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">تاريخ التسجيل</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m, i) => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{m.email}</td>

                  {/* Plan */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${
                      m.plan === "pro"
                        ? "bg-violet-50 text-violet-700 border border-violet-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      {m.plan === "pro" ? "⭐ Pro" : "مجانية"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                      m.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                      {m.status === "active" ? "مفعّل" : "موقوف"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(m.created_at).toLocaleDateString("ar-MA")}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Toggle status */}
                      <button
                        disabled={updating === m.id}
                        onClick={() => update(m.id, { status: m.status === "active" ? "inactive" : "active" })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                          m.status === "active"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {updating === m.id ? "..." : m.status === "active" ? "إيقاف" : "تفعيل"}
                      </button>

                      {/* Toggle plan */}
                      <button
                        disabled={updating === m.id}
                        onClick={() => update(m.id, { plan: m.plan === "free" ? "pro" : "free" })}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition"
                      >
                        {m.plan === "free" ? "→ Pro" : "→ مجاني"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {merchants.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">لا يوجد تجار مسجلون بعد</div>
          )}
        </div>
      </div>
    </div>
  );
}
