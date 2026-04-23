"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

const ADMIN_EMAIL = "ljidanouar7@gmail.com";

export default function AdminInvitePage() {
  const [authed, setAuthed]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied]     = useState(false);

  const [email, setEmail]       = useState("");
  const [storeName, setStoreName] = useState("");
  const [domain, setDomain]     = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        window.location.href = "/";
      } else {
        setAuthed(true);
        setLoading(false);
      }
    });
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setInviteLink("");

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, store_name: storeName, domain: domain || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "خطأ غير معروف");
    } else {
      setInviteLink(data.link);
      setEmail("");
      setStoreName("");
      setDomain("");
    }
    setSending(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-xl mx-auto px-6 py-12">

        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">الإدارة</p>
            <h1 className="text-2xl font-black text-slate-900">دعوة تاجر جديد</h1>
          </div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900 font-semibold transition">
            ← لوحة الإدارة
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <form onSubmit={sendInvite} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                placeholder="merchant@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                dir="ltr"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المتجر *</label>
              <input
                type="text"
                required
                placeholder="مثال: متجر الأناقة"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-teal-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">الدومين (اختياري)</label>
              <input
                type="text"
                placeholder="mystore.com"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                dir="ltr"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
              />
              <p className="text-xs text-slate-400 mt-1">بدون https:// أو www.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3.5 rounded-xl text-sm transition disabled:opacity-60"
            >
              {sending ? "جاري الإنشاء..." : "إنشاء رابط الدعوة ←"}
            </button>
          </form>

          {inviteLink && (
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-emerald-700 font-bold text-sm mb-3">✅ تم إنشاء رابط الدعوة!</p>
              <div className="bg-white border border-emerald-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-mono text-slate-600 break-all">{inviteLink}</p>
              </div>
              <button
                onClick={copyLink}
                className={`w-full py-2.5 rounded-xl font-bold text-sm transition ${
                  copied ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-700"
                }`}
              >
                {copied ? "✅ تم النسخ!" : "📋 نسخ الرابط"}
              </button>
              <p className="text-xs text-emerald-600 mt-2 text-center">الرابط صالح لمدة 7 أيام</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
