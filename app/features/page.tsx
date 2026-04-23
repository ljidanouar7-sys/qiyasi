import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

const features = [
  {
    icon: "🎯",
    title: "دقة عالية",
    subtitle: "High Accuracy",
    desc: "لا نكتفي بالطول والوزن — نأخذ شكل الجسم كاملاً في الحسبان.",
    details: [
      "7 معطيات جسدية (طول، وزن، كتف، ورك، بطن، رجلين، جنس)",
      "خوارزمية BMI + تعديلات شكل الجسم",
      "جدول مقاسات خاص بكل تاجر",
      "دقة تصل إلى 95% في اختيار المقاس الصحيح",
    ],
    color: "from-blue-500 to-blue-700",
  },
  {
    icon: "⚡",
    title: "سهولة التثبيت",
    subtitle: "Easy Installation",
    desc: "سطران من الكود تضعهما في أي موقع — بدون مطوّر.",
    details: [
      "كود HTML جاهز للنسخ من لوحة التحكم",
      "يعمل على Shopify بدون تطبيق",
      "يعمل على WordPress كـ HTML block",
      "يعمل على أي موقع HTML عادي",
    ],
    color: "from-violet-500 to-violet-700",
    code: true,
  },
  {
    icon: "📊",
    title: "تحليلات وبيانات",
    subtitle: "Analytics & Insights",
    desc: "تتبع أداء الأداة واعرف أكثر عن زبائنك.",
    details: [
      "عدد الزبائن الذين حسبوا مقاسهم",
      "توزيع المقاسات الأكثر طلباً",
      "معدل التحويل من الأداة إلى شراء",
      "تقارير شهرية تُرسل لبريدك",
    ],
    color: "from-green-500 to-emerald-700",
  },
  {
    icon: "🎨",
    title: "تخصيص كامل",
    subtitle: "Full Customization",
    desc: "كل تاجر يتحكم في تجربة زبائنه بالكامل.",
    details: [
      "جداول مقاسات مخصصة لكل فئة",
      "إضافة أعمدة قياسات إضافية",
      "مقاسات مخصصة (S/M/L أو أرقام 38/40/42...)",
      "لغة الأداة (عربي/إنجليزي)",
    ],
    color: "from-orange-500 to-red-600",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-violet-950 text-white py-20 px-6 text-center">
        <p className="text-violet-400 font-bold text-sm mb-3 uppercase tracking-wider">الميزات</p>
        <h1 className="text-5xl font-black mb-4">كل ما تحتاجه لحل مشكلة المقاسات</h1>
        <p className="text-white/70 text-xl max-w-2xl mx-auto">مبني خصيصاً لمتاجر الملابس العربية</p>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto space-y-16">
          {features.map((f, i) => (
            <div key={f.title} className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-12 items-center`}>
              {/* Icon side */}
              <div className="flex-shrink-0">
                <div className={`w-40 h-40 bg-gradient-to-br ${f.color} rounded-3xl flex items-center justify-center text-7xl shadow-2xl`}>
                  {f.icon}
                </div>
              </div>
              {/* Content */}
              <div className="flex-1">
                <p className="text-blue-600 text-sm font-bold mb-2 uppercase tracking-wider">{f.subtitle}</p>
                <h2 className="text-3xl font-black text-gray-900 mb-4">{f.title}</h2>
                <p className="text-gray-500 text-lg mb-6 leading-relaxed">{f.desc}</p>
                <ul className="space-y-3 mb-6">
                  {f.details.map(d => (
                    <li key={d} className="flex items-center gap-3 text-gray-700">
                      <div className="w-5 h-5 gradient-bg rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      {d}
                    </li>
                  ))}
                </ul>
                {f.code && (
                  <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs text-left" dir="ltr">
                    <div className="text-gray-500 mb-1">{"<!-- الصق هذا في موقعك -->"}</div>
                    <div>{"<script src=\"https://qiyasi.app/widget.js\"></script>"}</div>
                    <div>{"<script>"}</div>
                    <div className="mr-4">{"SizeMatcher.init({ apiKey: \"ssm_your_key\" });"}</div>
                    <div>{"</script>"}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-12">بدون vs مع المقاس الذكي</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-right">
              <h3 className="text-xl font-black text-red-700 mb-6">❌ بدون المقاس الذكي</h3>
              <ul className="space-y-3 text-red-600 text-sm">
                {["مرتجعات مرتفعة تصل 25-40%","زبائن غير راضين","خسارة في الوقت والمال","اتصالات يومية عن المقاسات","تقييمات سلبية على المنصات"].map(i=>(
                  <li key={i} className="flex items-center gap-2">
                    <span>✗</span> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-right">
              <h3 className="text-xl font-black text-green-700 mb-6">✅ مع المقاس الذكي</h3>
              <ul className="space-y-3 text-green-600 text-sm">
                {["انخفاض المرتجعات إلى أقل من 8%","زبائن راضون يعودون للشراء","توفير في التكاليف والوقت","الزبون يحدد مقاسه بنفسه","تقييمات إيجابية وثقة أكبر"].map(i=>(
                  <li key={i} className="flex items-center gap-2">
                    <span>✓</span> {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 gradient-bg text-white text-center">
        <h2 className="text-3xl font-black mb-4">جرّب كل هذه الميزات مجاناً</h2>
        <p className="text-white/70 mb-8">14 يوماً تجريبية — بدون بطاقة ائتمان</p>
        <Link href="/auth" className="inline-block bg-white text-blue-700 font-black text-lg px-10 py-4 rounded-xl hover:bg-gray-100 transition shadow-xl">
          ابدأ الآن ←
        </Link>
      </section>

      <Footer />
    </div>
  );
}
