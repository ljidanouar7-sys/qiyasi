import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black text-sm">ق</div>
              <span className="font-black text-slate-900 text-lg">قياسي</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              أداة ذكية تساعد متاجر الملابس على تقليل المرتجعات وتحسين تجربة الزبائن.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">المنتج</p>
              <ul className="space-y-3">
                {[{href:"/how-it-works",l:"كيف يعمل"},{href:"/features",l:"الميزات"},{href:"/pricing",l:"التسعير"},{href:"/embed-demo",l:"كود التضمين"}].map(i=>(
                  <li key={i.href}><Link href={i.href} className="text-sm text-slate-500 hover:text-slate-900 transition">{i.l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">الحساب</p>
              <ul className="space-y-3">
                {[{href:"/auth",l:"تسجيل الدخول"},{href:"/auth",l:"إنشاء حساب"}].map((i,idx)=>(
                  <li key={idx}><Link href={i.href} className="text-sm text-slate-500 hover:text-slate-900 transition">{i.l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-slate-400 text-xs">© 2025 قياسي. جميع الحقوق محفوظة.</p>
          <p className="text-slate-400 text-xs">صُنع في 🌍 للأسواق العربية</p>
        </div>
      </div>
    </footer>
  );
}
