"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const STEPS = ["اسم المتجر", "الدومين", "أول فئة مقاسات"];

function domainValid(d: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(d.trim());
}

export default function WelcomePage() {
  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [storeName, setStoreName]     = useState("");
  const [domain, setDomain]           = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryTag, setCategoryTag]   = useState("");

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }

    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;

    // Load existing progress to resume at correct step
    const { data: merchant } = await supabase
      .from("merchants")
      .select("store_name")
      .eq("user_id", user.id)
      .single();

    const domainRes = await fetch("/api/merchants/get-domain", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const domainJson = await domainRes.json();

    const { data: cats } = await supabase
      .from("categories")
      .select("id")
      .eq("merchant_id", (await supabase.from("merchants").select("id").eq("user_id", user.id).single()).data?.id)
      .limit(1);

    if (merchant?.store_name && merchant.store_name !== "متجري") setStoreName(merchant.store_name);
    if (domainJson.domain) setDomain(domainJson.domain);

    // Resume at the right step
    if (!merchant?.store_name || merchant.store_name === "متجري") { setStep(0); }
    else if (!domainJson.domain) { setStep(1); }
    else if (!cats || cats.length === 0) { setStep(2); }
    else { window.location.href = "/dashboard"; return; }

    setLoading(false);
  }

  async function saveStep() {
    setSaving(true);
    setError("");

    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;

    if (step === 0) {
      if (storeName.trim().length < 2) { setError("اسم المتجر قصير جداً"); setSaving(false); return; }
      const res = await fetch("/api/welcome/save-name", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ store_name: storeName }),
      });
      if (!res.ok) { setError("خطأ في الحفظ — حاول مجدداً"); setSaving(false); return; }
      setStep(1);
    }

    else if (step === 1) {
      if (!domainValid(domain)) { setError("أدخل دومين صحيح — مثال: mystore.com (بدون https://)"); setSaving(false); return; }
      const res = await fetch("/api/merchants/save-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!res.ok) { setError("خطأ في الحفظ — حاول مجدداً"); setSaving(false); return; }
      setStep(2);
    }

    else if (step === 2) {
      if (categoryName.trim().length < 2) { setError("اسم الفئة قصير جداً"); setSaving(false); return; }
      const res = await fetch("/api/welcome/save-category", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: categoryName, tag: categoryTag }),
      });
      if (!res.ok) { setError("خطأ في الحفظ — حاول مجدداً"); setSaving(false); return; }
      window.location.href = "/dashboard";
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-lg p-8">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-sm">ق</div>
          <span className="font-black text-slate-900 text-lg">قياسي</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
                  i < step ? "bg-teal-600 text-white" : i === step ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${i === step ? "text-teal-600" : "text-slate-400"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-1 ${i < step ? "bg-teal-600" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-1">ما اسم متجرك؟</h2>
            <p className="text-slate-400 text-sm mb-6">سيظهر هذا الاسم في لوحة التحكم</p>
            <input
              type="text"
              placeholder="مثال: متجر الأناقة العصرية"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-teal-400 transition"
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-1">ما دومين متجرك؟</h2>
            <p className="text-slate-400 text-sm mb-2">مهم للأمان — فقط طلبات من دومينك ستصل للـ AI</p>
            <p className="text-xs text-slate-400 mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100">
              أدخل الدومين بدون <span className="font-mono">https://</span> أو <span className="font-mono">www.</span><br/>
              مثال: <span className="font-mono text-teal-600">mystore.com</span>
            </p>
            <input
              type="text"
              placeholder="mystore.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              dir="ltr"
              className="w-full border border-slate-200 rounded-xl p-3.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-1">أنشئ أول فئة مقاسات</h2>
            <p className="text-slate-400 text-sm mb-6">
              سنضيف جدول مقاسات افتراضي للعبايات — يمكنك تعديله لاحقاً من لوحة التحكم
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الفئة</label>
                <input
                  type="text"
                  placeholder="مثال: عبايات نسائية"
                  value={categoryName}
                  onChange={e => {
                    setCategoryName(e.target.value);
                    setCategoryTag(e.target.value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "abayas");
                  }}
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-teal-400 transition"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">الـ Tag (يستخدمه الويدجت)</label>
                <input
                  type="text"
                  placeholder="abayas"
                  value={categoryTag}
                  onChange={e => setCategoryTag(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                  dir="ltr"
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
                />
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                <p className="text-teal-700 text-xs font-bold mb-1">📊 جدول المقاسات الافتراضي</p>
                <p className="text-teal-600 text-xs">XS/50 → S/52 → M/54 → L/56 → XL/58 → XXL/60 → 3XL/62</p>
                <p className="text-teal-500 text-xs mt-1">يمكنك تعديله من لوحة التحكم ← الفئات</p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-500 font-semibold">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => { setStep(step - 1); setError(""); }}
              className="text-slate-500 hover:text-slate-900 text-sm font-semibold transition"
            >
              ← رجوع
            </button>
          ) : <div />}

          <button
            onClick={saveStep}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white font-black px-8 py-3 rounded-xl text-sm transition disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : step === 2 ? "ابدأ الاستخدام ✓" : "التالي ←"}
          </button>
        </div>
      </div>
    </div>
  );
}
