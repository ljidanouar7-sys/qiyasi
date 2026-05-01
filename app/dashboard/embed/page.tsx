"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function EmbedPage() {
  const [copied, setCopied]       = useState(false);
  const [domain, setDomain]       = useState("");
  const [savedDomain, setSavedDomain] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);
  const [domainToast, setDomainToast]   = useState("");

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://qiyasi.net";

  const embedCode = `<!-- قياسي - احسب مقاسي | الصق هذا في هيدر متجرك مرة واحدة فقط -->
<script src="${appOrigin}/widget.js"></script>
<script>SizeMatcher.init();</script>`;

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
      // Load existing domain via service role API
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/merchants/get-domain", {
        headers: { Authorization: `Bearer ${s.session?.access_token}` },
      });
      const json = await res.json();
      if (json.domain) { setDomain(json.domain); setSavedDomain(json.domain); }
    }
  }

  async function saveDomain() {
    if (!domain.trim()) return;
    setSavingDomain(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session?.access_token) { window.location.href = "/auth"; return; }

      const res = await fetch("/api/merchants/save-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s.session.access_token}`,
        },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.domain) {
        setSavedDomain(data.domain);
        setDomain(data.domain);
        setDomainToast("✅ تم حفظ الدومين");
      } else {
        setDomainToast(`❌ ${data.error || "خطأ في الحفظ — حاول مجدداً"}`);
      }
    } catch {
      setDomainToast("❌ خطأ في الاتصال — تحقق من الإنترنت");
    } finally {
      setSavingDomain(false);
      setTimeout(() => setDomainToast(""), 3000);
    }
  }

  function copy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div dir="rtl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">التضمين</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">أضف زر "احسب مقاسي"</h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">خطوتان فقط — سجّل دومينك ثم انسخ الكود</p>
      </div>

      <div className="w-full max-w-2xl space-y-5">

        {/* Step 1 — Domain Registration */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">1</div>
            <h2 className="font-black text-slate-900">سجّل دومين متجرك</h2>
          </div>
          <p className="text-slate-400 text-xs mb-4">
            هذا مهم للأمان — فقط طلبات من دومينك المسجّل ستعمل مع الـ AI.
          </p>

          {savedDomain && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-3">
              <span className="text-emerald-600 text-sm">✅</span>
              <span className="text-emerald-700 text-sm font-bold font-mono">{savedDomain}</span>
              <span className="text-emerald-500 text-xs mr-auto">مسجّل ومفعّل</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="مثال: mystore.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              dir="ltr"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
            />
            <button
              onClick={saveDomain}
              disabled={savingDomain || !domain.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap disabled:opacity-50 sm:flex-shrink-0"
            >
              {savingDomain ? "جاري..." : "حفظ"}
            </button>
          </div>
          {domainToast && <p className="text-emerald-600 text-xs font-bold mt-2">{domainToast}</p>}
          <p className="text-slate-400 text-xs mt-2">
            لا تضع https:// أو www — فقط اسم الدومين مثل <span className="font-mono">mystore.com</span>
          </p>
        </div>

        {/* Step 2 — Embed Code */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">2</div>
            <h2 className="font-black text-slate-900">انسخ كود التضمين</h2>
          </div>

          {!savedDomain && (
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <p className="text-amber-700 text-sm font-bold">⚠️ سجّل دومينك أولاً لتفعيل الكود</p>
            </div>
          )}

          <div className="bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-mono">كود التضمين</span>
              {savedDomain && (
                <span className="bg-emerald-900 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  🔒 Zero API Key
                </span>
              )}
            </div>
            <pre className="text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap" dir="ltr">
              {embedCode}
            </pre>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button
              onClick={copy}
              className={`w-full py-3.5 rounded-xl font-black text-base transition ${
                copied
                  ? "bg-emerald-600 text-white"
                  : savedDomain
                  ? "bg-slate-900 hover:bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {copied ? "✅ تم النسخ!" : "📋 نسخ الكود"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="font-black text-slate-900 mb-4">كيف تضيفه؟</h2>
          <div className="space-y-4">
            {[
              { n: "1", t: "سجّل دومين متجرك", d: "أدخله في الحقل بالأعلى — يكفي مرة واحدة فقط" },
              { n: "2", t: "انسخ الكود والصقه في الهيدر", d: "في سلة: الإعدادات ← إضافة كود للهيدر. في Shopify: Theme ← Edit Code ← theme.liquid" },
              { n: "3", t: "احفظ — خلاص!", d: "الزر سيظهر تلقائياً في كل صفحة منتج — بدون API Key، بدون إعداد إضافي" },
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
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
            <div className="flex gap-2 mb-3 flex-wrap">
              {["XS","S","M","L","XL"].map(s => (
                <div key={s} className="w-12 h-10 border-2 border-slate-300 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600 bg-white">{s}</div>
              ))}
            </div>
            <button className="inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-2.5 rounded-lg" style={{ background: "#0d9488" }}>
              📏 احسب مقاسي
            </button>
            <p className="text-slate-400 text-xs mt-3">↑ الزر يظهر هنا بجانب خيارات المقاس</p>
          </div>
        </div>

      </div>
    </div>
  );
}
