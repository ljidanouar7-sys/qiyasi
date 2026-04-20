"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("blocked=1")) {
      setMessage("حسابك موقوف — تواصل مع الإدارة.");
    }
  }, []);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    else window.location.href = "/dashboard";

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-sm">ق</div>
          <span className="font-black text-slate-900 text-lg">قياسي</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 text-center mb-2">تسجيل الدخول</h1>
        <p className="text-slate-400 text-sm text-center mb-8">أدخل بيانات حسابك للمتابعة</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-200 rounded-xl p-3.5 text-right text-sm focus:outline-none focus:border-teal-400 transition"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-slate-200 rounded-xl p-3.5 text-right text-sm focus:outline-none focus:border-teal-400 transition"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-700 text-white rounded-xl p-3.5 font-bold text-sm transition mt-1"
          >
            {loading ? "جاري التحميل..." : "دخول ←"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}
      </div>
    </div>
  );
}
