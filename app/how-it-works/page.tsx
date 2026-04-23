import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

const steps = [
  {
    num: 1,
    title: "اندماج سهل",
    desc: "بمجرد دمجه، سيظهر زر 'احسب مقاسك' على صفحة تفاصيل المنتج الخاصة بك.",
    icon: (
      <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
      </svg>
    ),
  },
  {
    num: 2,
    title: "تفاعل الزبون",
    desc: "ينقر الزبون على الزر، فتظهر نافذة ترشده خلال أسئلة بسيطة عن جسمه وتفضيلاته.",
    icon: (
      <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
      </svg>
    ),
  },
  {
    num: 3,
    title: "توصية المقاس",
    desc: "يحلل النظام البيانات ويقدم توصية دقيقة بالمقاس المناسب فوراً — الزبون يشتري بثقة.",
    icon: (
      <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
];

const setupSteps = [
  {
    num: "01",
    title: "أنشئ حسابك مجاناً",
    desc: "سجّل خلال دقيقة. لا تحتاج بطاقة ائتمان للبدء.",
    details: ["أدخل بريدك وكلمة المرور", "اختر اسم متجرك", "ادخل لوحة التحكم مباشرة"],
  },
  {
    num: "02",
    title: "أضف فئاتك وجداول المقاسات",
    desc: "أدخل فئات منتجاتك مع جداول المقاسات الخاصة بك.",
    details: ["أنشئ فئة لكل نوع من منتجاتك", "أضف أعمدة المقاسات (صدر، خصر، طول...)", "أدخل القيم لكل مقاس (S، M، L، XL...)"],
  },
  {
    num: "03",
    title: "أضف منتجاتك",
    desc: "ربّط كل منتج بالفئة المناسبة حتى يحصل الزبون على المقاس الصحيح.",
    details: ["أضف اسم المنتج", "اختر الفئة المناسبة له", "فعّل المنتج ليظهر في الأداة"],
  },
  {
    num: "04",
    title: "زبائنك يحسبون مقاسهم بأنفسهم",
    desc: "يظهر زر قياسي في موقعك. الزبون يضغطه ويحصل على مقاسه في ثوانٍ.",
    details: ["أسئلة بسيطة وبصرية", "نتيجة فورية", "يعمل على الموبايل والحاسوب"],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="py-24 px-6 text-center bg-white border-b border-slate-100">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-4">كيف يعمل</p>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-5 tracking-tight">كيف يعمل قياسي؟</h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
          قم بدمج توصيات المقاسات في صفحات منتجاتك من خلال تجربة مستخدم بسيطة وبديهية.
        </p>
      </section>

      {/* 3 Steps Visual */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          {/* Steps row */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 right-[16.66%] left-[16.66%] h-0.5 bg-teal-200 z-0" />

            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10">
                {/* Icon circle */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-teal-50 border-2 border-teal-100 rounded-full flex items-center justify-center">
                    {s.icon}
                  </div>
                  {/* Number badge */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-black shadow-md">
                    {s.num}
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Setup Steps */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3 text-center">الإعداد</p>
          <h2 className="text-4xl font-black text-slate-900 mb-16 text-center tracking-tight">من التسجيل إلى أول مقاس</h2>

          <div className="space-y-8">
            {setupSteps.map((s, i) => (
              <div key={i} className="flex gap-6 items-start p-7 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow">
                  {s.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-slate-500 text-sm mb-3 leading-relaxed">{s.desc}</p>
                  <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
                    {s.details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-xs text-slate-600">
                        <svg className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-900 text-white text-center">
        <h2 className="text-4xl font-black mb-3 tracking-tight">جاهز للبدء؟</h2>
        <p className="text-slate-400 mb-10 text-lg">14 يوماً مجانية — بدون بطاقة ائتمان</p>
        <Link href="/auth" className="inline-block bg-white text-slate-900 hover:bg-slate-100 font-black text-base px-10 py-4 rounded-xl transition">
          اشتركوا الآن ←
        </Link>
      </section>

      <Footer />
    </div>
  );
}
