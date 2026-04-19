"use client";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

const T = {
  en: {
    badge: "Pricing",
    title: <>One plan.<br/>Simple pricing.</>,
    subtitle: "14-day free trial — no credit card required.",
    planLabel: "All-inclusive",
    priceNote: "Everything included. No hidden fees.",
    features: [
      "Unlimited products & categories",
      "Your own private API key",
      "Widget works on Shopify, WordPress, or any HTML",
      "Custom size charts per category",
      "Email support",
      "14-day free trial included",
    ],
    cta: "Start Free Trial →",
    fine: "Cancel anytime · No setup fees",
  },
  ar: {
    badge: "التسعير",
    title: <>خطة واحدة.<br/>سعر بسيط.</>,
    subtitle: "تجربة مجانية 14 يوماً — بدون بطاقة بنكية.",
    planLabel: "شامل لكل شيء",
    priceNote: "كل شيء مشمول. بدون رسوم خفية.",
    features: [
      "منتجات وفئات غير محدودة",
      "مفتاح API خاص بك",
      "الويدجت يعمل على Shopify وWordPress وأي HTML",
      "جداول مقاسات مخصصة لكل فئة",
      "دعم عبر البريد الإلكتروني",
      "تجربة مجانية 14 يوماً مشمولة",
    ],
    cta: "← ابدأ التجربة المجانية",
    fine: "إلغاء في أي وقت · بدون رسوم إعداد",
  },
};

export default function PricingPage() {
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const t = T[lang];
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={isAr ? "rtl" : "ltr"}>
      <Header />

      <section className="flex-1 flex items-center justify-center py-28 px-6">
        <div className="max-w-md w-full text-center">

          {/* Language toggle */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="text-xs font-bold border border-slate-200 rounded-full px-4 py-1.5 text-slate-500 hover:text-slate-900 hover:border-slate-400 transition"
            >
              {lang === "en" ? "عربي" : "EN"}
            </button>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-4">{t.badge}</p>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">{t.title}</h1>
          <p className="text-slate-500 text-lg mb-12">{t.subtitle}</p>

          <div className="bg-slate-50 border-2 border-teal-400 rounded-3xl p-10 shadow-lg">
            <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-4 text-center">{t.planLabel}</p>

            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-7xl font-black text-slate-900 leading-none">$10</span>
              <span className="text-slate-400 text-lg mb-2">/mo</span>
            </div>
            <p className="text-slate-400 text-sm mb-8 text-center">{t.priceNote}</p>

            <ul className="space-y-3 mb-10">
              {t.features.map(f => (
                <li key={f} className={`flex items-center gap-3 text-slate-700 text-sm ${isAr ? "flex-row-reverse text-right" : ""}`}>
                  <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/auth" className="block w-full bg-slate-900 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition text-base text-center">
              {t.cta}
            </Link>

            <p className="text-slate-400 text-xs text-center mt-4">{t.fine}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
