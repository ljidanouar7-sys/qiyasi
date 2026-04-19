"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";


export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("LOGIN ERROR:", error);
      if (error) setMessage(error.message + " | code: " + error.status);
      else window.location.href = "/dashboard";
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setMessage(error.message); setLoading(false); return; }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setMessage("تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.");
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-3 text-right"
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg p-3 text-right"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg p-3 font-bold hover:bg-blue-700"
          >
            {loading ? "جاري التحميل..." : isLogin ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-bold"
          >
            {isLogin ? "إنشاء حساب" : "تسجيل الدخول"}
          </button>
        </p>
      </div>
    </div>
  );
}
