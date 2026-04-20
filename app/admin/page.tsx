"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "ljidanouar7@gmail.com";

type Merchant = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in: string;
  confirmed: boolean;
};

export default function AdminPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace("/");
        return;
      }

      const res = await fetch("/api/admin/merchants", {
        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
      });

      if (!res.ok) { setError("خطأ في جلب البيانات"); setLoading(false); return; }
      const json = await res.json();
      setMerchants(json.merchants);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400 text-sm">جاري التحميل...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">لوحة الإدارة</p>
            <h1 className="text-3xl font-black text-slate-900">التجار المسجلون</h1>
          </div>
          <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm font-bold px-4 py-2 rounded-xl">
            {merchants.length} تاجر
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">الإيميل</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">تاريخ التسجيل</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">آخر دخول</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m, i) => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-slate-400 font-mono">{i + 1}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{m.email}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(m.created_at).toLocaleDateString("ar-MA")}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {m.last_sign_in ? new Date(m.last_sign_in).toLocaleDateString("ar-MA") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                      m.confirmed
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.confirmed ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {m.confirmed ? "مفعّل" : "غير مؤكد"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {merchants.length === 0 && (
            <div className="text-center py-16 text-slate-400">لا يوجد تجار مسجلون بعد</div>
          )}
        </div>
      </div>
    </div>
  );
}
