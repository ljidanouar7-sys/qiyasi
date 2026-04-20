"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function EmbedPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { initPage(); }, []);

  async function initPage() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/auth"; return; }

    let { data: merchant } = await supabase
      .from("merchants").select("id").eq("user_id", userData.user.id).single();

    if (!merchant) {
      const { data: m } = await supabase
        .from("merchants").insert({ user_id: userData.user.id, store_name: "متجري" })
        .select("id").single();
      merchant = m;
    }

    if (merchant) {
      const { data: keyRow } = await supabase
        .from("api_keys").select("key")
        .eq("merchant_id", merchant.id).eq("is_active", true)
        .order("created_at", { ascending: false }).limit(1).single();
      if (keyRow) setApiKey(keyRow.key);
    }
  }

  async function generateKey() {
    setLoading(true);
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch("/api/merchants/generate-key", {
      method: "POST",
      headers: { Authorization: `Bearer ${s.session?.access_token}` },
    });
    const data = await res.json();
    if (data.key) setApiKey(data.key);
    setLoading(false);
  }

  const domain = typeof window !== "undefined" ? window.location.origin : "https://qiyasi.net";

  const embedCode = `<!-- قياسي - احسب مقاسي | الصق هذا في هيدر متجرك -->
<script src="${domain}/widget.js"></script>
<script>SizeMatcher.init({ apiKey: "${apiKey || "YOUR_API_KEY"}" });</script>`;

  function copy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">التضمين</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">أضف زر "احسب مقاسي"</h1>
        <p className="text-slate-400 text-sm mt-1">خطوة واحدة فقط — انسخ الكود والصقه في متجرك</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Step 1 - API Key */}
        {!apiKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-amber-800 text-sm mb-0.5">أولاً: احصل على مفتاحك</p>
              <p className="text-amber-600 text-xs">مفتاح API مطلوب لتفعيل الزر في متجرك</p>
            </div>
            <button
              onClick={generateKey}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap"
            >
              {loading ? "جاري..." : "✨ احصل على المفتاح"}
            </button>
          </div>
        )}

        {/* Main code card */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">

          {/* Code block */}
          <div className="bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-mono">كود التضمين</span>
              {apiKey && (
                <span className="bg-emerald-900 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  ✓ مفتاحك موجود
                </span>
              )}
            </div>
            <pre className="text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap" dir="ltr">
              {embedCode}
            </pre>
          </div>

          {/* Copy button */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button
              onClick={copy}
              disabled={!apiKey}
              className={`w-full py-3.5 rounded-xl font-black text-base transition ${
                copied
                  ? "bg-emerald-600 text-white"
                  : apiKey
                  ? "bg-slate-900 hover:bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {copied ? "✅ تم النسخ!" : !apiKey ? "احصل على المفتاح أولاً" : "📋 نسخ الكود"}
            </button>
            {!apiKey && (
              <button
                onClick={generateKey}
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl font-bold text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 transition"
              >
                {loading ? "جاري التوليد..." : "✨ توليد مفتاح API"}
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="font-black text-slate-900 mb-4">كيف تضيفه؟</h2>
          <div className="space-y-4">
            {[
              { n: "1", t: "انسخ الكود", d: "اضغط زر \"نسخ الكود\" بالأعلى" },
              { n: "2", t: "الصقه في هيدر متجرك", d: "في سلة: الإعدادات ← إضافة كود للهيدر. في Shopify: Theme ← Edit Code ← theme.liquid" },
              { n: "3", t: "احفظ — خلاص!", d: "الزر سيظهر تلقائياً في كل صفحة منتج بجانب زر الشراء — بدون أي إعداد إضافي" },
            ].map(s => (
              <div key={s.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-black text-sm flex items-center justify-center flex-shrink-0">
                  {s.n}
                </div>
                <div className="pt-0.5">
                  <p className="font-bold text-slate-800 text-sm">{s.t}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="font-black text-slate-900 mb-1">معاينة الزر</h2>
          <p className="text-slate-400 text-xs mb-5">هكذا سيظهر الزر في متجرك</p>

          {/* Fake product page */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
            <div className="flex gap-2 mb-3 flex-wrap">
              {["XS","S","M","L","XL"].map(s => (
                <div key={s} className="w-12 h-10 border-2 border-slate-300 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600 bg-white">
                  {s}
                </div>
              ))}
            </div>
            <button
              className="inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-2.5 rounded-lg"
              style={{ background: "#0d9488" }}
            >
              📏 احسب مقاسي
            </button>
            <p className="text-slate-400 text-xs mt-3">↑ الزر يظهر هنا بجانب خيارات المقاس</p>
          </div>
        </div>

      </div>
    </div>
  );
}
