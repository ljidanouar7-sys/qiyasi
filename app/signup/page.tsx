import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm text-center">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-sm">ق</div>
          <span className="font-black text-slate-900 text-lg">قياسي</span>
        </div>
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-black text-slate-900 mb-3">الوصول بدعوة فقط</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          قياسي في مرحلة البيتا المغلقة حالياً.<br/>
          التسجيل متاح فقط عبر دعوة من الفريق.
        </p>
        <Link
          href="/auth"
          className="inline-block bg-slate-900 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
        >
          تسجيل الدخول ←
        </Link>
      </div>
    </div>
  );
}
