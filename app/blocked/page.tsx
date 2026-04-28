export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 w-full max-w-sm text-center">
        <div className="text-5xl mb-5">🔒</div>
        <h1 className="text-xl font-black text-slate-900 mb-3">الحساب موقوف</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          تم إيقاف حسابك مؤقتاً.<br />
          تواصل مع الإدارة لإعادة التفعيل.
        </p>
        <a
          href="mailto:ljidanouar7@gmail.com"
          className="inline-block mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-sm"
        >
          تواصل مع الإدارة
        </a>
      </div>
    </div>
  );
}
