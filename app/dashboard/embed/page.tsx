"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function EmbedPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/auth"; return; }

    let { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (!merchant) {
      const { data: newMerchant } = await supabase
        .from("merchants")
        .insert({ user_id: userData.user.id, store_name: "متجري" })
        .select("id")
        .single();
      merchant = newMerchant;
    }

    if (merchant) {
      setMerchantId(merchant.id);
      // Load existing key
      const { data: keyRow } = await supabase
        .from("api_keys")
        .select("key")
        .eq("merchant_id", merchant.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (keyRow) setApiKey(keyRow.key);
    }
  }

  async function generateKey() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/merchants/generate-key", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.key) setApiKey(data.key);
    setLoading(false);
  }

  const domain = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";

  const embedCode = `<!-- Smart Size Matcher Widget -->
<script src="${domain}/widget.js"></script>
<script>
  SizeMatcher.init({ apiKey: "${apiKey || "YOUR_API_KEY"}" });
</script>`;

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <a href="/dashboard" className="text-blue-600 font-bold">← لوحة التحكم</a>
        <h1 className="text-xl font-bold">كود التضمين</h1>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* API Key */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-4">مفتاح API الخاص بك</h2>

          {apiKey ? (
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm break-all mb-4 text-left" dir="ltr">
              {apiKey}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">لا يوجد مفتاح بعد. اضغط "توليد مفتاح" لإنشاء مفتاح جديد.</p>
          )}

          <button
            onClick={generateKey}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-bold"
          >
            {loading ? "جاري التوليد..." : apiKey ? "🔄 توليد مفتاح جديد" : "✨ توليد مفتاح"}
          </button>

          {apiKey && (
            <p className="text-red-500 text-sm mt-3">
              ⚠️ عند توليد مفتاح جديد، المفتاح القديم يُلغى تلقائياً.
            </p>
          )}
        </div>

        {/* Embed Code */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-2">كود التضمين</h2>
          <p className="text-gray-500 text-sm mb-4">
            انسخ هذا الكود والصقه في أي صفحة في موقعك — Shopify, WordPress, أو HTML عادي.
          </p>

          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm mb-4 text-left whitespace-pre-wrap" dir="ltr">
            {embedCode}
          </div>

          <button
            onClick={copyCode}
            className={`px-5 py-2 rounded-lg font-bold transition ${copied ? "bg-green-600 text-white" : "bg-gray-800 text-white hover:bg-gray-700"}`}
          >
            {copied ? "✅ تم النسخ!" : "📋 نسخ الكود"}
          </button>
        </div>

        {/* How to use */}
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-3">كيف تضيف الـ widget لموقعك؟</h3>
          <ol className="space-y-2 text-sm text-blue-700 list-decimal list-inside">
            <li>انسخ كود التضمين أعلاه</li>
            <li>في <strong>Shopify</strong>: Themes → Edit code → الصق في theme.liquid</li>
            <li>في <strong>WordPress</strong>: أضف Custom HTML block في أي صفحة</li>
            <li>في <strong>HTML عادي</strong>: الصق الكود قبل {"</body>"}</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
