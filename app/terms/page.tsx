import Link from "next/link";

export const metadata = { title: "Terms of Service — Qiyasi" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <header className="border-b border-slate-100 py-4 px-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-xs">ق</div>
          <span className="font-black text-slate-900">قياسي</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">شروط الخدمة</h1>
        <p className="text-slate-400 text-sm mb-10">آخر تحديث: أبريل 2026</p>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. القبول بالشروط</h2>
            <p>باستخدامك لمنصة قياسي (Qiyasi)، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام الخدمة.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. وصف الخدمة</h2>
            <p>قياسي هي منصة SaaS تتيح لأصحاب المتاجر الإلكترونية تضمين أداة ذكاء اصطناعي لتوصية المقاسات في مواقعهم. تشمل الخدمة:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 mr-4">
              <li>لوحة تحكم لإدارة الفئات وجداول المقاسات</li>
              <li>أداة قابلة للتضمين في المتجر (Widget)</li>
              <li>حساب المقاسات بالذكاء الاصطناعي</li>
              <li>إحصائيات الاستخدام</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. حساب المستخدم</h2>
            <p>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور. تتحمل المسؤولية الكاملة عن جميع الأنشطة التي تتم من خلال حسابك.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. الاستخدام المقبول</h2>
            <p>يوافق المستخدم على عدم:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 mr-4">
              <li>استخدام الخدمة لأغراض غير مشروعة</li>
              <li>محاولة الوصول غير المصرح به للأنظمة</li>
              <li>إعادة بيع الخدمة أو نسخها دون إذن مسبق</li>
              <li>إرسال طلبات مفرطة تؤثر على أداء الخدمة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. الملكية الفكرية</h2>
            <p>جميع حقوق الملكية الفكرية المتعلقة بمنصة قياسي، بما في ذلك الكود والتصميم والعلامة التجارية، هي ملك حصري لقياسي. لا يمنح هذا الاتفاق أي حق في هذه الملكية.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. الخصوصية والبيانات</h2>
            <p>نلتزم بحماية بياناتك وفقاً لـ <Link href="/privacy" className="text-teal-600 hover:underline">سياسة الخصوصية</Link>. بيانات عملاء متجرك (الطول، الوزن، المقاسات) تُعالَج لحظياً ولا تُخزَّن لدينا.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. تحديد المسؤولية</h2>
            <p>قياسي غير مسؤولة عن أي خسائر غير مباشرة أو عرضية ناتجة عن استخدام أو عدم القدرة على استخدام الخدمة. توصيات المقاسات تقديرية وتعتمد على المعلومات المدخلة.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. تعديل الشروط</h2>
            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو عبر لوحة التحكم.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. إنهاء الخدمة</h2>
            <p>يحق لنا إنهاء أو تعليق حسابك في حال انتهاك هذه الشروط. يحق لك إلغاء اشتراكك في أي وقت.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. التواصل</h2>
            <p>لأي استفسار حول هذه الشروط، تواصل معنا على: <a href="mailto:support@qiyasi.net" className="text-teal-600 hover:underline">support@qiyasi.net</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/privacy" className="hover:text-teal-600 transition">سياسة الخصوصية</Link>
          <Link href="/refund"  className="hover:text-teal-600 transition">سياسة الاسترداد</Link>
          <Link href="/"        className="hover:text-teal-600 transition">الصفحة الرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
