"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Rec = {
  rec_id:           string;
  category:         string | null;
  recommended_size: string;
  created_at:       string;
  requested_at:     string | null;
  customers:        { height: number | null; weight: number | null } | null;
  outcomes:         { status: string; return_reason?: string | null }[] | null;
};

function buildWhatsAppMsg(size: string, rec_id: string): string {
  return `السلام عليكم 🌟
شكراً على شرائك من متجرنا!
اقترحنا عليك مقاس ${size}. واش جاك مناسب؟
عافاك جاوبنا هنا باش نحسنو خدمتنا:
https://qiyasi.net/feedback?rec=${rec_id}
شكراً 🙏`;
}

function getStatus(rec: Rec): "done" | "sent" | "pending" {
  if (rec.outcomes?.length) return "done";
  if (rec.requested_at)     return "sent";
  return "pending";
}

export default function FeedbackDashboardPage() {
  const [recs,      setRecs]      = useState<Rec[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [fbFilter,  setFbFilter]  = useState("all");
  const [sending,   setSending]   = useState<string | null>(null);
  const [phones,    setPhones]    = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: merchant } = await supabase
      .from("merchants").select("id").eq("user_id", user.id).single();
    if (!merchant) return;

    const { data: custRows } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("merchant_id", merchant.id);

    const ids = (custRows ?? []).map(c => c.customer_id);
    if (!ids.length) { setRecs([]); setLoading(false); return; }

    const { data } = await supabase
      .from("recommendations")
      .select(`
        rec_id, category, recommended_size, created_at, requested_at,
        customers(height, weight),
        outcomes(status, return_reason)
      `)
      .in("customer_id", ids)
      .order("created_at", { ascending: false })
      .limit(200);

    setRecs((data as unknown as Rec[]) ?? []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function markRequested(rec_id: string) {
    await supabase.from("recommendations")
      .update({ requested_at: new Date().toISOString() })
      .eq("rec_id", rec_id);
    await load();
  }

  async function copyWhatsApp(rec: Rec) {
    const msg = buildWhatsAppMsg(rec.recommended_size, rec.rec_id);
    try {
      await navigator.clipboard.writeText(msg);
      showToast("✅ تم نسخ الرسالة");
    } catch {
      showToast("❌ فشل النسخ — حاول مجدداً");
      return;
    }
    await markRequested(rec.rec_id);
  }

  async function openWhatsApp(rec: Rec, phone: string) {
    const msg = buildWhatsAppMsg(rec.recommended_size, rec.rec_id);
    const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    await markRequested(rec.rec_id);
  }

  async function sendManual(rec_id: string, quick_feedback: string) {
    setSending(rec_id + quick_feedback);
    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rec_id, quick_feedback, feedback_type: "manual_merchant" }),
      });
      if (res.status === 409) showToast("⚠️ تم إرسال feedback لهذه التوصية من قبل");
      else if (res.ok)         { showToast("✅ تم الحفظ"); await load(); }
      else                     showToast("❌ حدث خطأ");
    } catch { showToast("❌ خطأ في الاتصال"); }
    finally  { setSending(null); }
  }

  const categories = [...new Set(recs.map(r => r.category).filter(Boolean))];

  const filtered = recs.filter(r => {
    const status = getStatus(r);
    if (catFilter !== "all" && r.category !== catFilter) return false;
    if (fbFilter === "done"    && status !== "done")    return false;
    if (fbFilter === "pending" && status === "done")    return false;
    return true;
  });

  const statusBadge = {
    done:    <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">وصل الفيدباك ✅</span>,
    sent:    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-semibold">اتبعت الرسالة ✉️</span>,
    pending: <span className="text-xs text-slate-400">مازال</span>,
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">التوصيات والفيدباك</h1>
        <button onClick={load} className="text-sm text-slate-400 hover:text-slate-700 transition">🔄 تحديث</button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">كل الفئات</option>
          {categories.map(c => <option key={c!} value={c!}>{c}</option>)}
        </select>
        <select value={fbFilter} onChange={e => setFbFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">كل الحالات</option>
          <option value="pending">مازال + اتبعت</option>
          <option value="done">وصل الفيدباك</option>
        </select>
        <span className="text-sm text-slate-400 self-center">{filtered.length} توصية</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-16">لا توجد توصيات</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-right font-semibold">الفئة</th>
                  <th className="px-4 py-3 text-right font-semibold">المقاس</th>
                  <th className="px-4 py-3 text-right font-semibold">الطول/الوزن</th>
                  <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-right font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rec => {
                  const status = getStatus(rec);
                  const cust   = rec.customers;
                  const date   = new Date(rec.created_at).toLocaleDateString("ar-MA");
                  const phone  = phones[rec.rec_id] ?? "";

                  return (
                    <tr key={rec.rec_id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{date}</td>
                      <td className="px-4 py-3 text-slate-700">{rec.category ?? "—"}</td>
                      <td className="px-4 py-3 font-bold text-teal-600">{rec.recommended_size}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {cust ? `${cust.height ?? "?"}سم / ${cust.weight ?? "?"}كغ` : "—"}
                      </td>
                      <td className="px-4 py-3">{statusBadge[status]}</td>
                      <td className="px-4 py-3">
                        {status !== "done" && (
                          <div className="flex gap-2 flex-wrap items-center">
                            {/* نسخ رسالة واتساب */}
                            <button onClick={() => copyWhatsApp(rec)}
                              className="text-xs px-2 py-1 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition whitespace-nowrap">
                              📱 انسخ رسالة
                            </button>

                            {/* رقم الهاتف */}
                            <input
                              type="tel"
                              placeholder="06XXXXXXXX"
                              value={phone}
                              onChange={e => setPhones(p => ({ ...p, [rec.rec_id]: e.target.value }))}
                              className="w-28 text-xs border border-slate-200 rounded-lg px-2 py-1 text-right"
                              dir="ltr"
                            />

                            {/* فتح واتساب */}
                            {phone && (
                              <button onClick={() => openWhatsApp(rec, phone)}
                                className="text-xs px-2 py-1 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition whitespace-nowrap">
                                📲 فتح واتساب
                              </button>
                            )}

                            {/* إدخال يدوي */}
                            {(["fit_good","too_tight","too_loose"] as const).map(fb => (
                              <button key={fb}
                                disabled={sending === rec.rec_id + fb}
                                onClick={() => sendManual(rec.rec_id, fb)}
                                className="text-xs px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50">
                                {fb === "fit_good" ? "مناسب" : fb === "too_tight" ? "ضيّق" : "واسع"}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl bg-slate-900 text-white whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
