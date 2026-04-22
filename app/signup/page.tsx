"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function SignUpPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage("خطأ في التسجيل — " + error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-sm">ق</div>
          <span className="font-black text-slate-900 text-lg">قياسي</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="text-xl font-black text-slate-900 mb-2">تحقق من بريدك الإلكتروني</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              أرسلنا لك رابط تأكيد على <span className="font-bold text-slate-700">{email}</span>.<br/>
              بعد التأكيد، يمكنك تسجيل الدخول لإكمال إعداد متجرك.
            </p>
            <Link
              href="/auth"
              className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
            >
              تسجيل الدخول ←
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-slate-900 text-center mb-2">إنشاء حساب تاجر</h1>
            <p className="text-slate-400 text-sm text-center mb-8">أدخل بياناتك لبدء تجربتك المجانية</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border border-slate-200 rounded-xl p-3.5 text-right text-sm focus:outline-none focus:border-teal-400 transition"
                required
              />
              <input
                type="password"
                placeholder="كلمة المرور (6 أحرف على الأقل)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border border-slate-200 rounded-xl p-3.5 text-right text-sm focus:outline-none focus:border-teal-400 transition"
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl p-3.5 font-bold text-sm transition mt-1 disabled:opacity-60"
              >
                {loading ? "جاري التسجيل..." : "إنشاء الحساب ←"}
              </button>
            </form>

            {message && (
              <p className="mt-4 text-center text-sm text-red-500">{message}</p>
            )}

            <p className="mt-6 text-center text-xs text-slate-400">
              لديك حساب بالفعل؟{" "}
              <Link href="/auth" className="text-teal-600 font-bold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
