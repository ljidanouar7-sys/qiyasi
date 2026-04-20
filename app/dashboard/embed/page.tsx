"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const PLATFORMS = [
  { id: "shopify", label: "Shopify", icon: "🛒" },
  { id: "wordpress", label: "WordPress", icon: "📝" },
  { id: "html", label: "HTML عادي", icon: "🌐" },
  { id: "gtm", label: "Google Tag Manager", icon: "🏷️" },
];

const STEPS: Record<string, { title: string; steps: string[] }> = {
  shopify: {
    title: "تضمين الـ Widget في Shopify",
    steps: [
      "سجّل دخولك إلى لوحة تحكم متجرك على Shopify.",
      'اذهب إلى: Online Store → Themes.',
      'اضغط على زر "..." بجانب الثيم الحالي ثم اختر "Edit code".',
      'في الشريط الجانبي اختر ملف "theme.liquid" (داخل مجلد Layout).',
      'ابحث عن الوسم </body> في نهاية الملف.',
      'الصق كود التضمين أعلاه مباشرةً قبل </body>.',
      'اضغط "Save" وافتح أي صفحة منتج للتأكد من ظهور الـ Widget.',
    ],
  },
  wordpress: {
    title: "تضمين الـ Widget في WordPress",
    steps: [
      "سجّل دخولك إلى لوحة تحكم WordPress.",
      'اذهب إلى: المظهر (Appearance) → محرر القوالب (Theme Editor).',
      'اختر ملف "footer.php" أو "header.php" من القائمة على اليمين.',
      'ابحث عن </body> وألصق كود التضمين قبله مباشرةً.',
      'اضغط "تحديث الملف".',
      "بديل أسهل: استخدم إضافة WPCode أو Header & Footer Scripts وألصق الكود فيها بدون تعديل ملفات القالب.",
    ],
  },
  html: {
    title: "تضمين الـ Widget في HTML عادي",
    steps: [
      "افتح ملف HTML الخاص بصفحة المنتج في أي محرر نصوص.",
      'ابحث عن الوسم </body> في نهاية الملف.',
      'الصق كود التضمين مباشرةً قبل </body>.',
      "احفظ الملف وارفعه إلى السيرفر.",
      "افتح الصفحة في المتصفح وتأكد من ظهور زر أو Widget المقاسات.",
    ],
  },
  gtm: {
    title: "تضمين الـ Widget عبر Google Tag Manager",
    steps: [
      "سجّل دخولك إلى حسابك في Google Tag Manager.",
      'اضغط على "Tags" ثم "New".',
      'اختر نوع الـ Tag: "Custom HTML".',
      "الصق كود التضمين كاملاً في حقل HTML.",
      'في قسم "Triggering" اختر "All Pages" أو صفحات المنتجات فقط.',
      'اضغط "Save" ثم "Submit" لنشر التغييرات.',
      'تأكد من ظهور الـ Widget بفتح موقعك وتفعيل GTM Preview Mode.',
    ],
  },
};

export default function EmbedPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState("shopify");

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/auth"; return; }

    let { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (!merchant) {
      const { data: newMerchant } = await supabase
        .from("merchants")
        .insert({ user_id: userData.user.id, store_name: "متجري" })
        .select("id")
        .single();
      merchant = newMerchant;
    }

    if (merchant) {
      const { data: keyRow } = await supabase
        .from("api_keys")
        .select("key")
        .eq("merchant_id", merchant.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (keyRow) setApiKey(keyRow.key);
    }
  }

  async function generateKey() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/merchants/generate-key", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.key) setApiKey(data.key);
    setLoading(false);
  }

  const domain = typeof window !== "undefined" ? window.location.origin : "https://qiyasi.net";

  const embedCode = `<!-- قياسي - Smart Size Matcher Widget -->
<script src="${domain}/widget.js"></script>
<script>
  SizeMatcher.init({ apiKey: "${apiKey || "YOUR_API_KEY"}" });
</script>`;

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const current = STEPS[activePlatform];

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">التضمين</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">كود التضمين</h1>
        <p className="text-slate-400 text-sm mt-1">أضف الـ Widget إلى متجرك في دقيقتين</p>
      </div>

      <div className="space-y-6 max-w-3xl">

        {/* API Key card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="font-black text-slate-900 mb-1">مفتاح API الخاص بك</h2>
          <p className="text-slate-400 text-sm mb-4">هذا المفتاح يربط الـ Widget بحسابك — لا تشاركه مع أحد.</p>

          {apiKey ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-sm break-all text-left mb-4 text-slate-700" dir="ltr">
              {apiKey}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-sm mb-4">
              لا يوجد مفتاح بعد — اضغط الزر أدناه لإنشاء مفتاحك
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={generateKey}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition"
            >
              {loading ? "جاري التوليد..." : apiKey ? "🔄 توليد مفتاح جديد" : "✨ توليد مفتاح"}
            </button>
            {apiKey && (
              <p className="text-amber-600 text-xs font-semibold">
                ⚠️ المفتاح القديم يُلغى عند التوليد الجديد
              </p>
            )}
          </div>
        </div>

        {/* Embed Code card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="font-black text-slate-900 mb-1">كود التضمين</h2>
          <p className="text-slate-400 text-sm mb-4">انسخ هذا الكود وألصقه في موقعك حسب الطريقة المناسبة أدناه.</p>

          <div className="bg-slate-900 text-emerald-400 rounded-xl p-4 font-mono text-sm mb-4 text-left whitespace-pre-wrap leading-relaxed" dir="ltr">
            {embedCode}
          </div>

          <button
            onClick={copyCode}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-700 text-white"
            }`}
          >
            {copied ? "✅ تم النسخ!" : "📋 نسخ الكود"}
          </button>
        </div>

        {/* Platform instructions */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-0">
            <h2 className="font-black text-slate-900 mb-1">كيف تضيف الـ Widget؟</h2>
            <p className="text-slate-400 text-sm mb-5">اختر المنصة التي تستخدمها واتبع الخطوات.</p>

            {/* Platform tabs */}
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                    activePlatform === p.id
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="p-6">
            <h3 className="font-black text-slate-800 mb-5 text-base">{current.title}</h3>
            <ol className="space-y-4">
              {current.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-slate-700 text-sm leading-relaxed pt-0.5"
                    dangerouslySetInnerHTML={{ __html: step.replace(/(".*?")/g, '<span class="font-bold text-slate-900">$1</span>') }}
                  />
                </li>
              ))}
            </ol>

            <div className="mt-6 bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="text-teal-700 text-sm font-semibold">
                💡 بعد التضمين، افتح صفحة منتج في متجرك وتأكد من ظهور الـ Widget. إذا واجهت مشكلة تواصل معنا.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
