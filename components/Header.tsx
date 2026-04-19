"use client";
import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/how-it-works", label: "كيف يعمل" },
  { href: "/features", label: "الميزات" },
  { href: "/pricing", label: "التسعير" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black text-sm">ق</div>
          <span className="font-black text-slate-900 text-lg">قياسي</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-slate-500 hover:text-slate-900 text-sm font-medium transition">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth" className="text-sm text-slate-600 hover:text-slate-900 font-medium px-4 py-2 transition">
            تسجيل الدخول
          </Link>
          <Link href="/auth" className="btn-primary text-sm !py-2 !px-5">
            ابدأ مجاناً
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50" onClick={() => setOpen(!open)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="block text-slate-700 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
            <Link href="/auth" className="block text-center text-sm text-slate-600 py-2 font-medium">تسجيل الدخول</Link>
            <Link href="/auth" className="block text-center btn-primary text-sm">ابدأ مجاناً</Link>
          </div>
        </div>
      )}
    </header>
  );
}
