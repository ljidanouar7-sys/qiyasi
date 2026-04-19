"use client";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const embedCode = `<!-- المقاس الذكي Widget -->
<script src="https://qiyasi.app/widget.js"></script>
<script>
  SizeMatcher.init({
    apiKey: "ssm_your_api_key_here"
  });
</script>`;

const shopifyCode = `{%- comment -%}
  أضف هذا في theme.liquid قبل </body>
{%- endcomment -%}
<script src="https://qiyasi.app/widget.js"></script>
<script>
  SizeMatcher.init({ apiKey: "ssm_your_api_key_here" });
</script>`;

const wordpressCode = `<!-- في محرر الـ HTML في WordPress -->
<script src="https://qiyasi.app/widget.js"></script>
<script>
  SizeMatcher.init({ apiKey: "ssm_your_api_key_here" });
</script>`;

export default function EmbedDemoPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"html" | "shopify" | "wordpress">("html");

  const codes = { html: embedCode, shopify: shopifyCode, wordpress: wordpressCode };

  function copy(key: string) {
    navigator.clipboard.writeText(codes[key as keyof typeof codes]);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-violet-950 text-white py-20 px-6 text-center">
        <p className="text-violet-400 font-bold text-sm mb-3 uppercase tracking-wider">التضمين</p>
        <h1 className="text-5xl font-black mb-4">كود التضمين</h1>
        <p className="text-white/70 text-xl max-w-2xl mx-auto">سطران فقط تضعهما في أي موقع — بدون مطوّر</p>
      </section>

      {/* Main */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Code section */}
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">الكود الجاهز</h2>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                سجّل في المقاس الذكي للحصول على مفتاح API الخاص بك، ثم انسخ الكود وضعه في موقعك.
              </p>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {[
                  { key: "html", label: "HTML" },
                  { key: "shopify", label: "Shopify" },
                  { key: "wordpress", label: "WordPress" },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as "html" | "shopify" | "wordpress")}
                    className={`text-xs font-bold px-4 py-2 rounded-lg transition ${activeTab === t.key ? "gradient-bg text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Code block */}
              <div className="relative">
                <div className="bg-gray-900 rounded-xl p-5 font-mono text-xs text-green-400 text-left leading-relaxed whitespace-pre-wrap overflow-x-auto" dir="ltr">
                  {codes[activeTab]}
                </div>
                <button
                  onClick={() => copy(activeTab)}
                  className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-lg transition ${copied === activeTab ? "bg-green-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                >
                  {copied === activeTab ? "✅ تم النسخ" : "📋 نسخ"}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">خطوات التثبيت</h2>
              <div className="space-y-6">
                {[
                  { step: "1", title: "سجّل واحصل على مفتاح API", desc: "من لوحة التحكم → كود التضمين → توليد مفتاح جديد." },
                  { step: "2", title: "انسخ الكود", desc: "انسخ الكود أعلاه واستبدل ssm_your_api_key_here بمفتاحك الحقيقي." },
                  { step: "3", title: "الصقه في موقعك", desc: "ضعه في أي صفحة منتج قبل إغلاق </body>. يظهر زر 'احسب مقاسك' تلقائياً." },
                ].map(s => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 text-sm font-bold mb-1">⚠️ تذكّر</p>
                <p className="text-amber-700 text-sm">لا تشارك مفتاح API الخاص بك مع أحد. كل مفتاح مرتبط بحسابك فقط.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4">كيف يظهر في موقعك؟</h2>
          <p className="text-gray-500 mb-10">يظهر زر "احسب مقاسك" بجانب كل منتج</p>

          {/* Mock product page */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-right">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-full sm:w-40 h-40 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-5xl flex-shrink-0">
                👗
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900 mb-1">عباية سوداء كلاسيكية</h3>
                <p className="text-gray-500 text-sm mb-3">قطعة أنيقة مناسبة لجميع المناسبات</p>
                <p className="text-2xl font-black text-blue-700 mb-4">299 ريال</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["S","M","L","XL"].map(s=>(
                    <button key={s} className="w-10 h-10 border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:border-blue-500 transition">{s}</button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="gradient-bg text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition text-sm">
                    أضف للسلة
                  </button>
                  <button className="border-2 border-blue-600 text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition text-sm">
                    📏 احسب مقاسك
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 gradient-bg text-white text-center">
        <h2 className="text-3xl font-black mb-4">سجّل الآن واحصل على مفتاح API الخاص بك</h2>
        <p className="text-white/70 mb-8">14 يوماً تجريبية مجانية</p>
        <a href="/auth" className="inline-block bg-white text-blue-700 font-black text-lg px-10 py-4 rounded-xl hover:bg-gray-100 transition shadow-xl">
          ابدأ مجاناً ←
        </a>
      </section>

      <Footer />
    </div>
  );
}
