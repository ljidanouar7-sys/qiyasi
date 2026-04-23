"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus]     = useState<"loading"|"valid"|"invalid"|"success">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail]       = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); setErrorMsg("رابط الدعوة غير صالح"); return; }

    fetch(`/api/accept-invitation?token=${token}`)
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) { setStatus("invalid"); setErrorMsg(data.error || "رابط غير صالح"); }
        else { setEmail(data.email); setStoreName(data.store_name); setStatus("valid"); }
      })
      .catch(() => { setStatus("invalid"); setErrorMsg("خطأ في التحقق من الرابط"); });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg("كلمتا المرور غير متطابقتين"); return; }
    if (password.length < 6)  { setErrorMsg("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }

    setSubmitting(true);
    setErrorMsg("");

    const res = await fetch("/api/accept-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || "خطأ في إنشاء الحساب");
      setSubmitting(false);
      return;
    }

    // Sign in with the newly created credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setErrorMsg("تم إنشاء الحساب — سجّل دخولك من هنا");
      setStatus("success");
    } else {
      window.location.href = "/welcome";
    }
    setSubmitting(false);
  }

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (status === "invalid") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">رابط غير صالح</h2>
        <p className="text-slate-500 text-sm">{errorMsg}</p>
      </div>
    </div>
  );

  if (status === "success") return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">تم إنشاء حسابك!</h2>
        <a href="/auth" className="inline-block mt-4 bg-teal-600 text-white font-bold px-6 py-3 rounded-xl text-sm">
          تسجيل الدخول ←
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-sm">ق</div>
          <span className="font-black text-slate-900 text-lg">قياسي</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 text-center mb-1">مرحباً بك في قياسي</h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          تمت دعوتك بمتجر <strong className="text-slate-700">{storeName}</strong> — أنشئ كلمة مرورك
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              readOnly
              dir="ltr"
              className="w-full border border-slate-100 rounded-xl p-3.5 text-sm font-mono bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
          <input
            type="password"
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-slate-200 rounded-xl p-3.5 text-right text-sm focus:outline-none focus:border-teal-400 transition"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="border border-slate-200 rounded-xl p-3.5 text-right text-sm focus:outline-none focus:border-teal-400 transition"
            required
          />

          {errorMsg && <p className="text-red-500 text-sm font-semibold">{errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl p-3.5 font-bold text-sm transition disabled:opacity-60 mt-1"
          >
            {submitting ? "جاري الإنشاء..." : "إنشاء الحساب وابدأ ←"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
