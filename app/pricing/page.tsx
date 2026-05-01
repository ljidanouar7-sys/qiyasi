"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const T = {
  en: {
    dir: "ltr" as const,
    nav: { logo: "Qiyasi", login: "Merchant Login" },
    badge: "Pricing",
    h1: "Simple, Transparent Pricing",
    sub: "Start free. Upgrade when you're ready.",
    toggle: { monthly: "Monthly", yearly: "Yearly", save: "Save 20%" },
    plans: [
      {
        name: "Free",
        price: { monthly: "$0", yearly: "$0" },
        period: "forever",
        desc: "Perfect for trying Qiyasi before you commit.",
        features: [
          "Up to 3 products",
          "1 category",
          "Basic size quiz",
          "Qiyasi branding on widget",
          "Community support",
        ],
        cta: "Get Started Free",
        href: "/auth",
        highlight: false,
      },
      {
        name: "Pro Monthly",
        price: { monthly: "$29", yearly: "$29" },
        period: "/month",
        desc: "Full power. Pay month to month, cancel anytime.",
        features: [
          "Unlimited products & categories",
          "Your own private API key",
          "Works on Shopify, WordPress, any HTML",
          "Custom size charts per category",
          "Priority email support",
          "14-day free trial included",
          "No Qiyasi branding",
        ],
        cta: "Start Free Trial →",
        href: "/auth",
        highlight: true,
        badge: "Most Popular",
      },
      {
        name: "Pro Yearly",
        price: { monthly: "$290", yearly: "$290" },
        period: "/year",
        desc: "Best value — two months free compared to monthly.",
        features: [
          "Everything in Pro Monthly",
          "2 months free (≈ $24/mo)",
          "Early access to new features",
          "Dedicated onboarding call",
          "Priority support (< 4h response)",
        ],
        cta: "Start Yearly Plan →",
        href: "/auth",
        highlight: false,
        badge: "Best Value",
      },
    ],
    faq: {
      label: "Common Questions",
      items: [
        { q: "Can I switch plans later?", a: "Yes. You can upgrade or downgrade anytime from your dashboard. Yearly plans are prorated if you switch early." },
        { q: "Is there a setup fee?", a: "None. Qiyasi integrates in under 2 minutes with a single embed snippet — no developer needed." },
        { q: "What happens after the free trial?", a: "You choose a plan or stay on the Free tier. We will never charge you without confirmation." },
        { q: "Does it work with my store platform?", a: "Yes. Qiyasi works on Shopify, WooCommerce, WordPress, or any custom HTML store." },
      ],
    },
    cta: {
      h2: "Want to see it live first?",
      sub: "Book a 15-minute demo and we will walk you through the full experience on your store.",
      btn: "Book a Free Demo →",
    },
    footer: "© 2025 Qiyasi · AI-Powered Size Intelligence",
  },
  ar: {
    dir: "rtl" as const,
    nav: { logo: "قياسي", login: "دخول التجار" },
    badge: "التسعير",
    h1: "أسعار بسيطة وشفافة",
    sub: "ابدأ مجاناً. ارقِ عندما تكون مستعداً.",
    toggle: { monthly: "شهري", yearly: "سنوي", save: "وفر 20٪" },
    plans: [
      {
        name: "مجاني",
        price: { monthly: "$0", yearly: "$0" },
        period: "للأبد",
        desc: "مثالي لتجربة قياسي قبل الالتزام.",
        features: [
          "حتى 3 منتجات",
          "فئة واحدة",
          "اختبار مقاسات أساسي",
          "شعار قياسي على الودجت",
          "دعم المجتمع",
        ],
        cta: "ابدأ مجاناً",
        href: "/auth",
        highlight: false,
      },
      {
        name: "برو شهري",
        price: { monthly: "$29", yearly: "$29" },
        period: "/شهر",
        desc: "القوة الكاملة. ادفع شهرياً، ألغِ في أي وقت.",
        features: [
          "منتجات وفئات غير محدودة",
          "مفتاح API خاص بك",
          "يعمل على Shopify وWordPress وأي HTML",
          "جداول مقاسات مخصصة لكل فئة",
          "دعم بريد إلكتروني مُفضَّل",
          "تجربة مجانية 14 يوماً",
          "بدون شعار قياسي",
        ],
        cta: "← ابدأ التجربة المجانية",
        href: "/auth",
        highlight: true,
        badge: "الأكثر شيوعاً",
      },
      {
        name: "برو سنوي",
        price: { monthly: "$290", yearly: "$290" },
        period: "/سنة",
        desc: "أفضل قيمة — شهران مجاناً مقارنةً بالشهري.",
        features: [
          "كل شيء في برو الشهري",
          "شهران مجاناً (≈ $24/شهر)",
          "وصول مبكر للميزات الجديدة",
          "مكالمة تأهيل مخصصة",
          "دعم مُفضَّل (< 4 ساعات)",
        ],
        cta: "← ابدأ الخطة السنوية",
        href: "/auth",
        highlight: false,
        badge: "أفضل قيمة",
      },
    ],
    faq: {
      label: "أسئلة شائعة",
      items: [
        { q: "هل يمكنني تغيير الخطة لاحقاً؟", a: "نعم. يمكنك الترقية أو التخفيض في أي وقت من لوحة التحكم. تُحسب الخطط السنوية بالتناسب إذا غيرت مبكراً." },
        { q: "هل هناك رسوم إعداد؟", a: "لا. يتكامل قياسي في أقل من دقيقتين بكود تضمين واحد — لا تحتاج مطوراً." },
        { q: "ماذا يحدث بعد التجربة المجانية؟", a: "تختار خطة أو تبقى على الطبقة المجانية. لن نفرض عليك رسوماً أبداً بدون تأكيد." },
        { q: "هل يعمل مع منصة متجري؟", a: "نعم. يعمل قياسي على Shopify وWooCommerce وWordPress وأي متجر HTML مخصص." },
      ],
    },
    cta: {
      h2: "تريد رؤيته مباشرةً أولاً؟",
      sub: "احجز عرضاً مدته 15 دقيقة وسنطلعك على التجربة الكاملة على متجرك.",
      btn: "← احجز عرضاً مجانياً",
    },
    footer: "© 2025 قياسي · ذكاء المقاسات بالذكاء الاصطناعي",
  },
};

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingPage() {
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qiyasi-lang");
      if (saved === "en" || saved === "ar") return saved;
    }
    return "ar";
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = T[lang];
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-slate-900" dir={t.dir}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/logo2.jpeg" alt="Qiyasi" width={56} height={56} className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-[#1E2235] text-2xl tracking-tight">{isAr ? "قياسي" : "Qiyasi"}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { const next = isAr ? "en" : "ar"; localStorage.setItem("qiyasi-lang", next); setLang(next); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
            >
              {isAr ? "EN" : "عربي"}
            </button>
            <Link href="/auth" className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 font-medium px-3 py-1.5 border border-slate-200 rounded-lg transition">
              {t.nav.login}
            </Link>
            <Link href="/#demo" className="btn-indigo !py-2 !px-5 !text-sm">
              {isAr ? "احجز عرضاً" : "Book Demo"}
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-24 px-6 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-5">{t.badge}</p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-4">{t.h1}</h1>
        <p className="text-slate-500 text-xl mb-0">{t.sub}</p>
      </section>

      {/* PLANS */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {t.plans.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300
                ${plan.highlight
                  ? "bg-indigo-600 text-white shadow-[0_0_60px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500 scale-[1.03]"
                  : "bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg"
                }`}
            >
              {/* Badge */}
              {"badge" in plan && plan.badge && (
                <div className={`absolute -top-3.5 ${isAr ? "left-6" : "right-6"}`}>
                  <span className={`text-xs font-black px-3 py-1 rounded-full
                    ${plan.highlight ? "bg-white text-indigo-600" : "bg-indigo-100 text-indigo-700"}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <p className={`text-xs font-black uppercase tracking-widest mb-3
                ${plan.highlight ? "text-indigo-200" : "text-indigo-500"}`}>
                {plan.name}
              </p>

              {/* Price */}
              <div className="mb-2">
                <span className={`text-6xl font-black leading-none
                  ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  {plan.price.monthly}
                </span>
                <span className={`text-base font-medium ms-1
                  ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                  {plan.period}
                </span>
              </div>

              <p className={`text-sm mb-8 leading-relaxed
                ${plan.highlight ? "text-indigo-100" : "text-slate-500"}`}>
                {plan.desc}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className={`flex items-start gap-2.5 text-sm
                    ${plan.highlight ? "text-indigo-50" : "text-slate-600"}`}>
                    {plan.highlight
                      ? <svg className="w-4 h-4 text-indigo-200 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      : <CheckIcon />
                    }
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`block w-full text-center font-black py-3.5 rounded-2xl transition text-sm
                  ${plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-indigo-50"
                    : "bg-slate-900 text-white hover:bg-slate-700"
                  }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          {isAr ? "لا رسوم إعداد · إلغاء في أي وقت · لا بطاقة بنكية للتجربة" : "No setup fees · Cancel anytime · No credit card for free trial"}
        </p>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest text-indigo-500 mb-3">{t.faq.label}</p>
          <div className="space-y-3 mt-10">
            {t.faq.items.map((item, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors
                    ${isAr ? "text-right" : "text-left"} ${openFaq === i ? "text-indigo-600" : "text-slate-800"}`}
                >
                  <span>{item.q}</span>
                  <span className="text-indigo-400 font-black text-xl flex-shrink-0 ms-4">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                <div className={`px-6 transition-all duration-300 overflow-hidden
                  ${openFaq === i ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO CTA */}
      <section className="pb-28 px-6">
        <div className="max-w-2xl mx-auto bg-indigo-600 rounded-3xl px-10 py-16 text-center
                        shadow-[0_0_80px_rgba(99,102,241,0.2)]">
          <h2 className="text-white font-black text-3xl md:text-4xl tracking-tight mb-4">{t.cta.h2}</h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">{t.cta.sub}</p>
          <Link
            href="/#demo"
            className="inline-block bg-white text-indigo-600 font-black px-10 py-4 rounded-2xl
                       hover:bg-indigo-50 transition text-base shadow-lg"
          >
            {t.cta.btn}
          </Link>
          <p className="text-indigo-300 text-xs mt-6">
            {isAr ? "بدون التزام · 15 دقيقة فقط" : "No commitment · 15 minutes only"}
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">{t.footer}</p>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/" className="hover:text-slate-700 transition">{isAr ? "الرئيسية" : "Home"}</Link>
            <Link href="/how-it-works" className="hover:text-slate-700 transition">{isAr ? "كيف يعمل" : "How it Works"}</Link>
            <Link href="/#demo" className="hover:text-slate-700 transition">{isAr ? "تواصل" : "Contact"}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
