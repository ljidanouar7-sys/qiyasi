"use client";
import { useState } from "react";
import Link from "next/link";

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    dir: "ltr" as const,
    nav: { logo: "Qiyasi", demo: "Request Demo", login: "Sign in" },
    hero: {
      badge: "AI-Powered Size Intelligence",
      h1a: "Stop Losing Revenue",
      h1b: "to Wrong Sizes.",
      sub: "The smart sizing layer for fashion brands. Help customers find their perfect fit — reduce returns, increase conversions, and build lasting trust.",
      cta1: "Request Demo",
      cta2: "See How It Works",
      trust: "Trusted by 200+ fashion brands · No credit card required",
    },
    problem: {
      label: "The Problem",
      h2: "Sizing is fashion's most expensive problem.",
      stat: "28%",
      statLabel: "of online fashion returns are caused by wrong sizing",
      body: "Every return costs you money, time, and customer trust. Generic size charts are broken — they don't account for body shape, fit preferences, or category differences.",
      items: ["Lost revenue from returns & refunds", "Damaged brand reputation", "Higher logistics & operational costs"],
    },
    solution: {
      label: "The Solution",
      h2: "Intelligent sizing, effortlessly integrated.",
      sub: "Three steps. Zero friction. Works inside your existing store.",
      steps: [
        { num: "01", title: "Customer Answers", desc: "A short, visual questionnaire — no measuring tape required. Completed in under 30 seconds." },
        { num: "02", title: "Smart Analysis", desc: "Our system processes body profile, fit preferences, and your brand's specific size data instantly." },
        { num: "03", title: "Perfect Recommendation", desc: "The right size, presented with confidence. Customers buy more — and keep what they buy." },
      ],
    },
    preview: {
      label: "Product Preview",
      h2: "The experience your customers deserve.",
      sub: "Embedded directly in your product pages. Zero redirects.",
      q: "How would you describe your shoulder width?",
      opts: ["Narrow", "Average", "Broad"],
      result: "Your recommended size",
      size: "M",
      fit: "Regular Fit · High confidence",
      confidence: "94% match",
    },
    trust: {
      label: "Impact",
      h2: "Numbers that matter.",
      metrics: [
        { val: "↓ 40%", label: "Average reduction in return rate" },
        { val: "↑ 28%", label: "Increase in conversion rate" },
        { val: "94%", label: "Size recommendation accuracy" },
        { val: "< 30s", label: "Time to complete questionnaire" },
      ],
      logos: "Trusted by brands on",
    },
    integrations: {
      label: "Integrations",
      h2: "Works where you already sell.",
      sub: "Two lines of code. Plug into any storefront in minutes.",
      platforms: ["Shopify", "WooCommerce", "Magento", "Custom HTML"],
      code: `<script src="https://qiyasi.app/widget.js"></script>\n<script>Qiyasi.init({ apiKey: "YOUR_KEY" });</script>`,
    },
    embed: {
      label: "How It Works",
      h2: "Perfect sizes for every clothing piece.",
      sub: "Embed Qiyasi in your store with just two lines of code. Every customer gets their exact size on the spot — no guessing, no returns.",
      quizTitle: "Size Quiz",
      quizBadge: "High Accuracy",
      quizIntro: "We ask questions to estimate body measurements:",
      quizItems: ["Height & Weight", "Body Type", "Fit Preference (Slim, Regular, Relaxed)"],
      tabs: ["Perfect Match!", "Clothing Sizes", "Shoe Sizes"],
      result: "Your recommended size",
      confidence: "Confidence:",
      fitType: "Fit Type:",
      fitValue: "Regular",
      addToCart: "Add to Cart",
      codeLabel: "Copy Embed Code",
    },
    pricing: {
      label: "Pricing",
      h2: "One plan. Simple pricing.",
      sub: "14-day free trial — no credit card required.",
      plan: "All-inclusive",
      period: "/mo",
      desc: "Everything included. No hidden fees.",
      features: [
        "Unlimited products & categories",
        "Your own private API key",
        "Widget works on Shopify, WordPress, or any HTML",
        "Custom size charts per category",
        "Email support",
        "14-day free trial included",
      ],
      cta: "Start Free Trial →",
      note: "Cancel anytime · No setup fees",
    },
    cta: {
      h2: "Ready to eliminate sizing errors?",
      sub: "Book a 20-minute demo. See Qiyasi live on your store.",
      btn: "Book a Demo",
      note: "Free 14-day trial · Cancel anytime · No setup fees",
    },
    footer: {
      tagline: "AI-powered sizing for fashion brands.",
      links: ["How It Works", "Features", "Pricing", "Embed Code"],
      copy: "© 2025 Qiyasi. All rights reserved.",
    },
  },

  ar: {
    dir: "rtl" as const,
    nav: { logo: "قياسي", demo: "احجز عرضاً", login: "تسجيل الدخول" },
    hero: {
      badge: "ذكاء اصطناعي لتحديد المقاس",
      h1a: "توقف عن خسارة أرباحك",
      h1b: "بسبب مقاسات خاطئة.",
      sub: "طبقة المقاسات الذكية لمتاجر الملابس. ساعد زبائنك في إيجاد المقاس المثالي — قلل المرتجعات، وزد المبيعات، وابنِ ثقة تدوم.",
      cta1: "احجز عرضاً",
      cta2: "شاهد كيف يعمل",
      trust: "موثوق من أكثر من 200 علامة تجارية · بدون بطاقة ائتمان",
    },
    problem: {
      label: "المشكلة",
      h2: "المقاسات هي أغلى مشكلة في عالم الموضة.",
      stat: "28%",
      statLabel: "من مرتجعات الملابس سببها اختيار المقاس الخاطئ",
      body: "كل عملية إرجاع تكلفك مالاً ووقتاً وثقة الزبون. جداول المقاسات التقليدية قاصرة — لا تأخذ في الحسبان شكل الجسم أو تفضيلات الارتداء.",
      items: ["خسارة الإيرادات من الإرجاع والاسترداد", "تضرر سمعة العلامة التجارية", "ارتفاع تكاليف اللوجستيات والعمليات"],
    },
    solution: {
      label: "الحل",
      h2: "مقاسات ذكية، تكامل سلس.",
      sub: "ثلاث خطوات. صفر عقبات. يعمل داخل متجرك الحالي.",
      steps: [
        { num: "01", title: "الزبون يجيب", desc: "استبيان بصري قصير — بدون شريط قياس. يكتمل في أقل من 30 ثانية." },
        { num: "02", title: "تحليل ذكي", desc: "نظامنا يعالج ملف الجسم وتفضيلات الارتداء وبيانات مقاساتك الخاصة فورياً." },
        { num: "03", title: "توصية دقيقة", desc: "المقاس الصحيح، بثقة تامة. الزبائن يشترون أكثر — ويحتفظون بما اشتروه." },
      ],
    },
    preview: {
      label: "معاينة المنتج",
      h2: "التجربة التي يستحقها زبائنك.",
      sub: "مدمج مباشرة في صفحات منتجاتك. بدون أي إعادة توجيه.",
      q: "كيف تصف عرض كتفيك؟",
      opts: ["ضيقة", "متوسطة", "عريضة"],
      result: "مقاسك الموصى به",
      size: "M",
      fit: "قصة عادية · ثقة عالية",
      confidence: "تطابق 94%",
    },
    trust: {
      label: "الأثر",
      h2: "أرقام تُحدث فرقاً.",
      metrics: [
        { val: "↓ 40%", label: "متوسط انخفاض نسبة المرتجعات" },
        { val: "↑ 28%", label: "زيادة في معدل التحويل" },
        { val: "94%", label: "دقة توصية المقاس" },
        { val: "< 30s", label: "وقت إتمام الاستبيان" },
      ],
      logos: "موثوق من علامات تجارية على",
    },
    integrations: {
      label: "التكاملات",
      h2: "يعمل أينما تبيع.",
      sub: "سطران من الكود. يعمل مع أي متجر في دقائق.",
      platforms: ["Shopify", "WooCommerce", "Magento", "HTML مخصص"],
      code: `<script src="https://qiyasi.app/widget.js"></script>\n<script>Qiyasi.init({ apiKey: "YOUR_KEY" });</script>`,
    },
    embed: {
      label: "كيف يعمل",
      h2: "مقاسات مثالية لكل قطعة ملابس.",
      sub: "يندمج قياسي في متجرك بسطرين من الكود فقط. كل زبون يحصل على مقاسه الصحيح من أول مرة — بدون تخمين، بدون إرجاع.",
      quizTitle: "اختبار المقاسات",
      quizBadge: "دقة عالية",
      quizIntro: "نطرح أسئلة لتقدير قياسات الجسم:",
      quizItems: ["الطول والوزن", "نوع الجسم", "تفضيل المقاس (ضيق، عادي، فضفاض)"],
      tabs: ["تطابق مثالي!", "مقاسات الملابس", "مقاسات الأحذية"],
      result: "المقاس الموصى به",
      confidence: "الثقة بالنفس:",
      fitType: "نمط المقاس:",
      fitValue: "عادي",
      addToCart: "أضف إلى السلة",
      codeLabel: "انسخ كود التضمين",
    },
    pricing: {
      label: "التسعير",
      h2: "خطة وحدة، سعر واضح.",
      sub: "14 يوماً تجريبية مجانية — بدون بطاقة ائتمان.",
      plan: "كل شيء مشمول",
      period: "/شهر",
      desc: "كل الميزات مشمولة. بدون رسوم خفية.",
      features: [
        "منتجات وفئات غير محدودة",
        "مفتاح API خاص بمتجرك",
        "الأداة تعمل على Shopify وWordPress وأي موقع",
        "جداول مقاسات مخصصة لكل فئة",
        "دعم بالبريد الإلكتروني",
        "تجربة مجانية 14 يوماً مشمولة",
      ],
      cta: "ابدأ التجربة المجانية ←",
      note: "إلغاء في أي وقت · بدون رسوم تفعيل",
    },
    cta: {
      h2: "جاهز لإنهاء مشكلة المقاسات؟",
      sub: "احجز جلسة تعريفية لمدة 20 دقيقة. شاهد قياسي على متجرك مباشرة.",
      btn: "احجز عرضاً",
      note: "تجربة مجانية 14 يوماً · إلغاء في أي وقت · بدون رسوم تفعيل",
    },
    footer: {
      tagline: "ذكاء اصطناعي لمقاسات علامات الموضة.",
      links: ["كيف يعمل", "الميزات", "التسعير", "كود التضمين"],
      copy: "© 2025 قياسي. جميع الحقوق محفوظة.",
    },
  },
};

type Lang = "en" | "ar";

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">
      {children}
    </p>
  );
}

function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight ${className}`}>
      {children}
    </h2>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [activeOpt, setActiveOpt] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const t = T[lang];
  const isAr = lang === "ar";

  return (
    <div dir={t.dir} className="min-h-screen bg-white text-slate-900">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">{t.nav.logo}</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 font-medium">
            {[
              { href: "/how-it-works", label: isAr ? "كيف يعمل" : "How it works" },
              { href: "/features",     label: isAr ? "الميزات"  : "Features" },
              { href: "/pricing",      label: isAr ? "التسعير"  : "Pricing" },
            ].map(l => (
              <Link key={l.href} href={l.href} className="hover:text-slate-900 transition">{l.label}</Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
            >
              {isAr ? "EN" : "عربي"}
            </button>
            <Link href="/auth" className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 font-medium transition px-3 py-1.5">
              {t.nav.login}
            </Link>
            <span className="bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg">
              {isAr ? "بيتا مغلقة — بالدعوة فقط" : "Exclusive Beta"}
            </span>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="min-h-[92vh] flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #8ecfc9 0%, #a8ddd7 40%, #7bbfba 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-6 w-full py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

            {/* LEFT — text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-sm text-slate-800 text-xs font-bold px-4 py-2 rounded-full mb-8 border border-white/40">
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                {t.hero.badge}
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight mb-6">
                {t.hero.h1a}
                <br />
                {t.hero.h1b}
              </h1>

              <p className="text-lg text-slate-700 leading-relaxed max-w-md mb-10">
                {t.hero.sub}
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <a
                  href="#solution"
                  className="bg-white/40 hover:bg-white/60 backdrop-blur-sm text-slate-800 font-semibold px-8 py-3.5 rounded-full transition text-base border border-white/50"
                >
                  {t.hero.cta2}
                </a>
                <span className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-full text-base opacity-70 cursor-default">
                  {isAr ? "بالدعوة فقط 🔒" : "Invitation Only 🔒"}
                </span>
              </div>

              <p className="text-sm text-slate-600">{t.hero.trust}</p>
            </div>

            {/* RIGHT — product mockup card */}
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-[340px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/60">
                {/* Product image area */}
                <div
                  className="h-52 flex items-end justify-center relative"
                  style={{ background: "linear-gradient(160deg, #d4ede9 0%, #b8dbd7 100%)" }}
                >
                  <div className="text-center pb-4">
                    <div className="text-7xl">👗</div>
                  </div>
                </div>

                {/* Product info */}
                <div className="p-5" dir={t.dir}>
                  <p className="text-slate-400 text-xs mb-1">{isAr ? "عبايات نسائية" : "Women's Abayas"}</p>
                  <h3 className="font-black text-slate-900 text-base mb-0.5">
                    {isAr ? "عباية سوداء كلاسيكية" : "Classic Black Abaya"}
                  </h3>
                  <p className="text-slate-500 text-sm font-semibold mb-4">
                    {isAr ? "299 ر.س" : "$82"}
                  </p>

                  <p className="text-xs text-slate-400 font-semibold mb-2">
                    {isAr ? "المقاس:" : "Size:"}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["XS", "S", "M", "L", "XL"].map(s => (
                      <button
                        key={s}
                        className={`w-10 h-10 rounded-xl border text-xs font-bold transition
                          ${s === "M"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Qiyasi button inside mockup */}
                  <button className="w-full flex items-center justify-center gap-2 border border-teal-300 bg-teal-50 text-teal-700 text-sm font-bold py-3 rounded-xl hover:bg-teal-100 transition">
                    <div className="w-5 h-5 bg-teal-600 rounded-md flex items-center justify-center text-white text-xs font-black">ق</div>
                    {isAr ? "احسب مقاسك" : "Find My Size"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BENEFITS BANNER ── */}
      <section className="py-24 px-6" style={{background:"linear-gradient(160deg,#0f2027 0%,#1a3a3a 60%,#0d2626 100%)"}}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start mb-16">
            {/* Left text */}
            <div>
              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-4">
                {isAr ? "لماذا قياسي؟" : "Why Qiyasi?"}
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {isAr
                  ? "زوّد متجرك بذكاء المقاسات الذي يثق به زبائنك."
                  : "Equip your store with size intelligence that shoppers trust."}
              </h2>
            </div>
            {/* Right sub */}
            <div className="flex items-end h-full pb-2">
              <p className="text-slate-400 text-lg leading-relaxed">
                {isAr
                  ? "توصيات دقيقة، تكامل سهل، ونتائج تظهر من أول أسبوع."
                  : "Accurate recommendations, seamless integration, and results you'll see in week one."}
              </p>
            </div>
          </div>

          {/* Cards row */}
          <div className="flex flex-wrap gap-5 items-start mb-12">
            {/* Feature cards */}
            {[
              {
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"/>
                  </svg>
                ),
                label: isAr ? "مرتجعات أقل" : "Fewer Returns",
                bg: "bg-teal-600",
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.286 4.286a11.948 11.948 0 014.306-6.43l3.182-5.51m0 0 5.511 3.181m-5.51-3.182 3.182 5.511"/>
                  </svg>
                ),
                label: isAr ? "تحويل أعلى" : "Higher Conversion",
                bg: "bg-teal-700",
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
                  </svg>
                ),
                label: isAr ? "دعم أقل" : "Less Support",
                bg: "bg-teal-800",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="flex-1 min-w-[160px] max-w-[200px] bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition"
              >
                <div className={`w-14 h-14 ${card.bg} rounded-xl flex items-center justify-center mb-5`}>
                  {card.icon}
                </div>
                <p className="text-white font-black text-base leading-snug">{card.label}</p>
              </div>
            ))}

            {/* Size result card */}
            <div className="flex-shrink-0 bg-white rounded-2xl p-6 w-[140px] shadow-2xl border-2 border-teal-300 flex flex-col items-center justify-center text-center">
              <p className="text-7xl font-black text-slate-900 leading-none mb-1">M</p>
              <p className="text-xs text-slate-400 font-semibold">{isAr ? "مقاسك" : "Your Size"}</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            <a href="#demo" className="flex items-center gap-2 bg-white text-slate-900 font-bold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition text-sm">
              {isAr ? "شاهد الأداة في العمل" : "See Size Tool in Action"} →
            </a>
            <Link href="/auth" className="flex items-center gap-2 border border-white/20 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/10 transition text-sm">
              {isAr ? "تواصل مع المبيعات" : "Contact Sales"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <Label>{t.problem.label}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading className="mb-6">{t.problem.h2}</SectionHeading>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">{t.problem.body}</p>
              <ul className="space-y-3">
                {t.problem.items.map(item => (
                  <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-[120px] font-black text-slate-900 leading-none tracking-tighter">
                  {t.problem.stat}
                </div>
                <p className="text-slate-500 text-lg max-w-xs leading-relaxed mt-2">
                  {t.problem.statLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Label>{t.solution.label}</Label>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <SectionHeading className="max-w-xl">{t.solution.h2}</SectionHeading>
            <p className="text-slate-500 text-lg max-w-xs leading-relaxed">{t.solution.sub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100 rounded-2xl overflow-hidden">
            {t.solution.steps.map((s, i) => (
              <div key={i} className="bg-white p-10 hover:bg-slate-50 transition">
                <p className="text-xs font-black text-slate-300 mb-6 tracking-widest">{s.num}</p>
                <h3 className="text-xl font-black text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT PREVIEW ── */}
      <section className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <Label>{t.preview.label}</Label>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <SectionHeading className="max-w-lg">{t.preview.h2}</SectionHeading>
            <p className="text-slate-500 text-lg max-w-xs leading-relaxed">{t.preview.sub}</p>
          </div>

          {/* UI mockup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl mx-auto">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex gap-1.5">
                {["#FDA4AF","#FCD34D","#86EFAC"].map(c => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{background:c}}/>
                ))}
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-400 max-w-xs mx-auto text-left">
                yourstore.com/products/abaya
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left: question OR final screen */}
              <div className="p-8 border-b md:border-b-0 md:border-l border-slate-100" dir={t.dir}>
                {!showResult ? (
                  <>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                      {isAr ? "الخطوة 3 من 5" : "Step 3 of 5"}
                    </p>
                    <h3 className="text-lg font-black text-slate-900 mb-6 leading-snug">
                      {t.preview.q}
                    </h3>
                    <div className="space-y-2.5">
                      {t.preview.opts.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setActiveOpt(opt)}
                          className={`w-full text-right px-4 py-3.5 rounded-xl border text-sm font-semibold transition ${
                            activeOpt === opt
                              ? "border-teal-600 bg-teal-600 text-white"
                              : "border-slate-200 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {activeOpt && (
                      <button
                        onClick={() => setShowResult(true)}
                        className="mt-6 w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-sm hover:bg-slate-700 transition"
                      >
                        {isAr ? "التالي ←" : "Continue →"}
                      </button>
                    )}
                  </>
                ) : (
                  /* Final stage — result found */
                  <div className="flex flex-col items-center justify-center h-full text-center py-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      {isAr ? "وجدنا مقاسك!" : "We found your size!"}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-5">
                      {isAr
                        ? "بناءً على إجاباتك، المقاس الأمثل لك هو M. يمكنك الشراء الآن بثقة."
                        : "Based on your answers, your perfect size is M. You can now buy with confidence."}
                    </p>
                    <button
                      onClick={() => { setShowResult(false); setActiveOpt(null); }}
                      className="text-xs text-slate-400 hover:text-slate-600 underline transition"
                    >
                      {isAr ? "إعادة الاختبار" : "Retake quiz"}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Result card */}
              <div className={`p-8 flex flex-col justify-center transition-opacity duration-500 ${showResult ? "opacity-100" : "opacity-30"}`} dir={t.dir}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                  {t.preview.result}
                </p>
                <div className="text-8xl font-black leading-none mb-3" style={{ color: "#166534" }}>
                  {t.preview.size}
                </div>
                <p className="text-slate-500 text-sm mb-6">{t.preview.fit}</p>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl self-start">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {t.preview.confidence}
                </div>
                {!showResult && (
                  <p className="text-xs text-slate-300 mt-4">
                    {isAr ? "أجب على السؤال لتظهر النتيجة" : "Answer the question to see result"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Label>{t.trust.label}</Label>
          <SectionHeading className="mb-20">{t.trust.h2}</SectionHeading>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden">
            {t.trust.metrics.map(m => (
              <div key={m.val} className="bg-white px-8 py-10">
                <div className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
                  {m.val}
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMBED / HOW IT WORKS ── */}
      <section className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <Label>{t.embed.label}</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-20">
            {/* Left: heading + quiz card */}
            <div dir={t.dir}>
              <SectionHeading className="mb-6">{t.embed.h2}</SectionHeading>
              <p className="text-slate-500 text-lg leading-relaxed mb-10">{t.embed.sub}</p>

              <div className="border-2 border-slate-200 rounded-2xl p-6 bg-white">
                <div className={`flex items-center justify-between mb-4 ${isAr ? "flex-row-reverse" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <span className="font-black text-slate-900 text-sm">{t.embed.quizTitle}</span>
                  </div>
                  <span className="text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full">
                    {t.embed.quizBadge}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-4">{t.embed.quizIntro}</p>
                <ul className="space-y-2.5">
                  {t.embed.quizItems.map(item => (
                    <li key={item} className={`flex items-center gap-3 text-slate-700 text-sm ${isAr ? "flex-row-reverse" : ""}`}>
                      <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: widget mockup */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden" dir={t.dir}>
              {/* Tabs */}
              <div className={`flex border-b border-slate-100 px-2 ${isAr ? "flex-row-reverse" : ""}`}>
                {t.embed.tabs.map((tab, i) => (
                  <button key={tab} className={`py-3.5 px-3 text-xs font-bold transition whitespace-nowrap ${
                    i === 1
                      ? "border-b-2 border-violet-600 text-slate-900"
                      : "text-slate-400"
                  }`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Recommendation card */}
                <div className="bg-violet-100 rounded-2xl py-10 flex flex-col items-center justify-center mb-4">
                  <span className="text-6xl font-black text-violet-700 leading-none mb-2">
                    {isAr ? "م" : "M"}
                  </span>
                  <p className="text-sm text-violet-500 font-semibold">{t.embed.result}</p>
                </div>

                {/* Stats */}
                <div className="space-y-2.5 mb-5 px-1">
                  <div className={`flex items-center justify-between text-sm ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className="text-slate-400 font-medium">{t.embed.confidence}</span>
                    <span className="text-emerald-500 font-bold">95%</span>
                  </div>
                  <div className={`flex items-center justify-between text-sm ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className="text-slate-400 font-medium">{t.embed.fitType}</span>
                    <span className="text-slate-700 font-bold">{t.embed.fitValue}</span>
                  </div>
                </div>

                {/* CTA button */}
                <button className="w-full bg-slate-200 text-slate-400 font-bold py-3.5 rounded-xl text-sm cursor-not-allowed">
                  {t.embed.addToCart}
                </button>

                {/* Navigation dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-4 h-1.5 bg-violet-600 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-36 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
            {t.cta.h2}
          </h2>
          <Link href="/auth" className="inline-block bg-white text-slate-900 hover:bg-slate-100 font-black text-lg px-10 py-4 rounded-xl transition">
            {isAr ? "تسجيل الدخول ←" : "Sign In →"}
          </Link>
          <p className="text-slate-600 text-sm mt-8">{t.cta.note}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-900 rounded-sm" />
            </div>
            <span className="font-black text-white">{t.nav.logo}</span>
            <span className="text-slate-600 text-sm">— {t.footer.tagline}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            {[
              ["/how-it-works", t.footer.links[0]],
              ["/features",     t.footer.links[1]],
              ["/pricing",      t.footer.links[2]],
              ["/embed-demo",   t.footer.links[3]],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-white transition">{label}</Link>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-600 text-xs">{t.footer.copy}</p>
            <div className="flex gap-4 text-xs text-slate-600">
              <Link href="/terms"   className="hover:text-slate-400 transition">{isAr ? "شروط الخدمة" : "Terms"}</Link>
              <Link href="/privacy" className="hover:text-slate-400 transition">{isAr ? "الخصوصية" : "Privacy"}</Link>
              <Link href="/refund"  className="hover:text-slate-400 transition">{isAr ? "الاسترداد" : "Refund"}</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
