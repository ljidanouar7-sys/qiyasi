"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const T = {
  en: {
    dir: "ltr" as const,
    nav: { logo: "Qiyasi", login: "Merchant Login" },
    badge: "FAQ",
    h1: "Common Questions",
    sub: "Everything you need to know about Qiyasi.",
    items: [
      {
        q: "How does Qiyasi determine the right size?",
        a: "Customers answer a short visual quiz (height, weight, shoulders, belly, fit preference). Our engine estimates body measurements and scores them against your brand's size chart — no measuring tape needed.",
      },
      {
        q: "Which platforms is it compatible with?",
        a: "Any platform that supports HTML — Shopify, WooCommerce, Magento, or a fully custom store. Integration is two lines of code.",
      },
      {
        q: "How long does integration take?",
        a: "Under 2 minutes for most stores. Add two script tags to your product page template and you're live.",
      },
      {
        q: "Is customer data stored or shared?",
        a: "No personal data is stored. Body estimates are computed in real time and never saved to any database.",
      },
      {
        q: "What if the recommendation is wrong?",
        a: "Our engine achieves 98% accuracy. In rare cases, customers can retake the quiz. Contact support and we'll investigate any systematic issues.",
      },
    ],
    cta: {
      h2: "Still have questions?",
      sub: "Book a free 15-minute demo and we'll answer everything live on your store.",
      btn: "Book a Free Demo →",
    },
    footer: "© 2025 Qiyasi. All rights reserved.",
  },
  ar: {
    dir: "rtl" as const,
    nav: { logo: "قياسي", login: "دخول التجار" },
    badge: "الأسئلة الشائعة",
    h1: "أسئلة شائعة",
    sub: "كل ما تحتاج معرفته عن قياسي.",
    items: [
      {
        q: "كيف يحدد قياسي المقاس الصحيح؟",
        a: "يجيب الزبائن على استبيان بصري قصير (الطول، الوزن، عرض الكتف، البطن، تفضيل الارتداء). يقدّر محركنا قياسات الجسم ويقيّمها مقابل جدول مقاسات علامتك التجارية.",
      },
      {
        q: "ما المنصات المدعومة؟",
        a: "أي منصة تدعم HTML — Shopify وWooCommerce وMagento وأي متجر مخصص. التكامل بسطرين من الكود فقط.",
      },
      {
        q: "كم يستغرق التكامل؟",
        a: "أقل من دقيقتين لمعظم المتاجر. أضف وسمتي script في قالب صفحة المنتج وستكون جاهزاً.",
      },
      {
        q: "هل يتم تخزين بيانات الزبائن أو مشاركتها؟",
        a: "لا يتم تخزين أي بيانات شخصية. تقديرات الجسم تُحسب في الوقت الفعلي ولا تُحفظ في أي قاعدة بيانات.",
      },
      {
        q: "ماذا لو كانت التوصية خاطئة؟",
        a: "يحقق محركنا دقة 98%. في حالات نادرة يمكن للزبائن إعادة الاختبار. تواصل مع الدعم وسنحقق في أي مشكلة منهجية.",
      },
    ],
    cta: {
      h2: "لا تزال لديك أسئلة؟",
      sub: "احجز عرضاً مجانياً لمدة 15 دقيقة وسنجيب على كل شيء مباشرةً على متجرك.",
      btn: "← احجز عرضاً مجانياً",
    },
    footer: "© 2025 قياسي. جميع الحقوق محفوظة.",
  },
};

export default function FAQPage() {
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qiyasi-lang");
      if (saved === "en" || saved === "ar") return saved;
    }
    return "ar";
  });
  const [open, setOpen] = useState<number | null>(null);
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

          <div className="hidden md:flex items-center gap-8 text-sm">
            {[
              { href: "/",           label: isAr ? "الرئيسية"        : "Home"         },
              { href: "/#solution",  label: isAr ? "كيف يعمل"        : "How It Works" },
              { href: "/#demo",      label: isAr ? "الديمو"          : "Demo"         },
              { href: "/pricing",    label: isAr ? "التسعير"         : "Pricing"      },
              { href: "/faq",        label: isAr ? "الأسئلة الشائعة" : "FAQ"          },
            ].map((l, i) => (
              <Link key={i} href={l.href}
                className={`transition-colors font-medium ${l.href === "/faq" ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"}`}>
                {l.label}
              </Link>
            ))}
          </div>

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

      {/* HEADER */}
      <section className="py-24 px-6 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-5">{t.badge}</p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-4">{t.h1}</h1>
        <p className="text-slate-500 text-xl">{t.sub}</p>
      </section>

      {/* FAQ ACCORDION */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {t.items.map((item, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={`w-full flex items-center justify-between px-6 py-5 text-sm font-semibold transition-colors
                  ${isAr ? "text-right" : "text-left"} ${open === i ? "text-indigo-600" : "text-slate-800 hover:text-slate-900"}`}
              >
                <span>{item.q}</span>
                <span className="text-indigo-400 font-black text-xl flex-shrink-0 ms-4">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              <div className={`px-6 transition-all duration-300 overflow-hidden
                ${open === i ? "max-h-60 pb-5 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
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
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <Link href="/"          className="hover:text-slate-700 transition">{isAr ? "الرئيسية"        : "Home"        }</Link>
            <Link href="/#solution" className="hover:text-slate-700 transition">{isAr ? "كيف يعمل"        : "How It Works"}</Link>
            <Link href="/pricing"   className="hover:text-slate-700 transition">{isAr ? "التسعير"         : "Pricing"     }</Link>
            <Link href="/#demo"     className="hover:text-slate-700 transition">{isAr ? "تواصل"           : "Contact"     }</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
