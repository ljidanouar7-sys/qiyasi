import Link from "next/link";

export const metadata = { title: "Privacy Policy — Qiyasi" };

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-black text-slate-900 mb-2">سياسة الخصوصية</h1>
        <p className="text-slate-400 text-sm mb-10">آخر تحديث: أبريل 2026</p>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. المعلومات التي نجمعها</h2>
            <p className="mb-2"><strong className="text-slate-800">بيانات التجار (أصحاب المتاجر):</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4 mb-3">
              <li>الاسم والبريد الإلكتروني عند التسجيل</li>
              <li>اسم المتجر ونطاق الموقع</li>
              <li>جداول المقاسات التي تدخلونها</li>
              <li>إحصائيات استخدام الأداة</li>
            </ul>
            <p className="mb-2"><strong className="text-slate-800">بيانات عملاء المتاجر:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الطول والوزن وتفاصيل الجسم المدخلة في الأداة</li>
              <li>هذه البيانات تُعالَج لحظياً فقط ولا تُخزَّن في قواعد بياناتنا</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. كيف نستخدم بياناتك</h2>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تقديم خدمة توصية المقاسات</li>
              <li>تحسين دقة الخوارزميات</li>
              <li>التواصل معك بشأن حسابك والخدمة</li>
              <li>إرسال تحديثات المنصة (يمكنك إلغاء الاشتراك)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. مشاركة البيانات</h2>
            <p className="mb-2">لا نبيع بياناتك لأطراف ثالثة. نشارك البيانات فقط مع:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li><strong>Supabase:</strong> قاعدة البيانات وإدارة المصادقة</li>
              <li><strong>Groq (Llama AI):</strong> معالجة طلبات توصية المقاسات لحظياً</li>
              <li><strong>Vercel:</strong> استضافة التطبيق</li>
              <li><strong>Upstash:</strong> إدارة حدود الطلبات (Rate Limiting)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. الاحتفاظ بالبيانات</h2>
            <p>نحتفظ ببيانات حسابك طالما حسابك نشط. عند إلغاء الاشتراك، يمكنك طلب حذف بياناتك خلال 30 يوماً. بيانات عملاء المتاجر لا تُخزَّن أصلاً.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. الأمان</h2>
            <p>نستخدم تشفير HTTPS لجميع الاتصالات. بيانات الحسابات مخزنة بشكل آمن عبر Supabase مع تشفير كامل. مفاتيح API محمية ولا تُعرَض للعملاء.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. ملفات تعريف الارتباط (Cookies)</h2>
            <p>نستخدم cookies ضرورية فقط لإدارة جلسات تسجيل الدخول. لا نستخدم cookies للتتبع أو الإعلانات.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. حقوقك</h2>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الاطلاع على بياناتك المخزنة لدينا</li>
              <li>تصحيح بياناتك غير الدقيقة</li>
              <li>طلب حذف بياناتك</li>
              <li>تصدير بياناتك</li>
            </ul>
            <p className="mt-2">للممارسة هذه الحقوق، تواصل معنا على: <a href="mailto:support@qiyasi.net" className="text-teal-600 hover:underline">support@qiyasi.net</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. تغييرات على هذه السياسة</h2>
            <p>قد نحدّث سياسة الخصوصية هذه. سنشعرك بأي تغييرات جوهرية عبر البريد الإلكتروني.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. التواصل</h2>
            <p>لأي استفسار حول خصوصيتك: <a href="mailto:support@qiyasi.net" className="text-teal-600 hover:underline">support@qiyasi.net</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/terms"  className="hover:text-teal-600 transition">شروط الخدمة</Link>
          <Link href="/refund" className="hover:text-teal-600 transition">سياسة الاسترداد</Link>
          <Link href="/"       className="hover:text-teal-600 transition">الصفحة الرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
