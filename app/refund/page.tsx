import Link from "next/link";

export const metadata = { title: "Refund Policy — Qiyasi" };

export default function RefundPage() {
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
        <h1 className="text-3xl font-black text-slate-900 mb-2">سياسة الاسترداد</h1>
        <p className="text-slate-400 text-sm mb-10">آخر تحديث: أبريل 2026</p>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">

          <section className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
            <p className="text-teal-800 font-semibold">نؤمن بعدالة التسعير. إذا لم تكن راضياً عن خدمتنا، نحن هنا لمساعدتك.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. ضمان استرداد 14 يوماً</h2>
            <p>إذا اشتركت في قياسي وقررت الإلغاء خلال <strong>14 يوماً</strong> من تاريخ الاشتراك الأول، يحق لك الحصول على استرداد كامل بدون أي شروط.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. حالات الاسترداد المقبولة</h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>الإلغاء خلال 14 يوماً من الاشتراك الأول</li>
              <li>عطل تقني موثّق منعك من استخدام الخدمة لأكثر من 48 ساعة متواصلة</li>
              <li>رسوم مزدوجة أو خطأ في الفوترة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. حالات غير مشمولة بالاسترداد</h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>طلبات الاسترداد بعد 14 يوماً من الاشتراك</li>
              <li>الاشتراكات المتجددة (الشهر الثاني وما بعده) بعد تجاوز 14 يوماً من التجديد</li>
              <li>انتهاك شروط الخدمة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. كيفية طلب الاسترداد</h2>
            <ol className="list-decimal list-inside space-y-2 mr-4">
              <li>تواصل معنا على <a href="mailto:support@qiyasi.net" className="text-teal-600 hover:underline">support@qiyasi.net</a></li>
              <li>أرسل موضوع الرسالة: <strong>"طلب استرداد"</strong></li>
              <li>اذكر البريد الإلكتروني المرتبط بحسابك وسبب الاسترداد</li>
              <li>سنرد خلال <strong>2 يوم عمل</strong></li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. مدة معالجة الاسترداد</h2>
            <p>بعد الموافقة على طلب الاسترداد، يُعالَج خلال <strong>5–10 أيام عمل</strong> حسب جهة الدفع (Paddle/بطاقة بنكية).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. إلغاء الاشتراك</h2>
            <p>يمكنك إلغاء اشتراكك في أي وقت من لوحة التحكم أو بالتواصل معنا. بعد الإلغاء، تبقى الخدمة متاحة حتى نهاية الفترة المدفوعة.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. تواصل معنا</h2>
            <p>لأي استفسار حول الفوترة أو الاسترداد: <a href="mailto:support@qiyasi.net" className="text-teal-600 hover:underline">support@qiyasi.net</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/terms"   className="hover:text-teal-600 transition">شروط الخدمة</Link>
          <Link href="/privacy" className="hover:text-teal-600 transition">سياسة الخصوصية</Link>
          <Link href="/"        className="hover:text-teal-600 transition">الصفحة الرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
