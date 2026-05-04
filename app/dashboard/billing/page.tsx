"use client";
import { useEffect, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { supabase } from "../../../lib/supabase";

const MONTHLY_PRICE = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID!;
const YEARLY_PRICE  = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID!;
const CLIENT_TOKEN  = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!;

export default function BillingPage() {
  const [plan,        setPlan]        = useState<string>("free");
  const [email,       setEmail]       = useState<string>("");
  const [merchantId,  setMerchantId]  = useState<string>("");
  const [paddle,      setPaddle]      = useState<Paddle | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly"|"yearly"|null>(null);

  useEffect(() => { initPage(); }, []);

  async function initPage() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth"; return; }
      setEmail(user.email ?? "");

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id, plan")
        .eq("user_id", user.id)
        .single();

      if (merchant) {
        setMerchantId(merchant.id);
        setPlan(merchant.plan || "free");
      }

      try {
        const p = await initializePaddle({
          environment: "sandbox",
          token: CLIENT_TOKEN,
        });
        if (p) setPaddle(p);
      } catch (e) {
        console.error("[Billing] Paddle init failed:", e);
      }
    } finally {
      setLoading(false);
    }
  }

  async function openCheckout(cycle: "monthly" | "yearly") {
    if (!paddle || !email) return;
    setCheckoutLoading(cycle);
    try {
      await paddle.Checkout.open({
        items: [{ priceId: cycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE, quantity: 1 }],
        customer: { email },
        customData: { merchant_id: merchantId },
        settings: { displayMode: "overlay", theme: "light", locale: "ar" },
      });
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-400 text-sm font-bold">جاري التحميل...</p>
    </div>
  );

  const isPro = plan === "pro";

  return (
    <div dir="rtl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">الباقة</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">إدارة اشتراكك</h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">
          باقتك الحالية:
          <span className={`font-black mr-1 ${isPro ? "text-teal-600" : "text-slate-500"}`}>
            {isPro ? "Pro ⭐" : "مجانية"}
          </span>
        </p>
      </div>

      {isPro ? (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 max-w-md">
          <div className="text-3xl mb-3">🎉</div>
          <h2 className="font-black text-teal-900 text-lg mb-1">أنت على باقة Pro</h2>
          <p className="text-teal-700 text-sm">تستمتع بكل المزايا — حتى 50 فئة، دعم أولوية، وكل الميزات القادمة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">

          {/* Monthly */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">شهري</p>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl font-black text-slate-900">$15</span>
              <span className="text-slate-400 text-sm mb-1">/شهر</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-slate-600">
              <li>✅ حتى 50 فئة</li>
              <li>✅ ذكاء اصطناعي لا محدود</li>
              <li>✅ دعم أولوية</li>
            </ul>
            <button
              onClick={() => openCheckout("monthly")}
              disabled={!!checkoutLoading}
              className="w-full bg-slate-900 hover:bg-slate-700 text-white font-black py-3 rounded-xl transition disabled:opacity-50"
            >
              {checkoutLoading === "monthly" ? "جاري..." : "اشترك شهرياً"}
            </button>
          </div>

          {/* Yearly */}
          <div className="bg-white border-2 border-teal-500 rounded-2xl p-6 shadow-sm relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-black px-3 py-1 rounded-full">
              وفّر شهرين 🎁
            </div>
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">سنوي</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-black text-slate-900">$150</span>
              <span className="text-slate-400 text-sm mb-1">/سنة</span>
            </div>
            <p className="text-teal-600 text-xs font-bold mb-4">بدل $180 — وفّر $30</p>
            <ul className="space-y-2 mb-6 text-sm text-slate-600">
              <li>✅ حتى 50 فئة</li>
              <li>✅ ذكاء اصطناعي لا محدود</li>
              <li>✅ دعم أولوية</li>
            </ul>
            <button
              onClick={() => openCheckout("yearly")}
              disabled={!!checkoutLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3 rounded-xl transition disabled:opacity-50"
            >
              {checkoutLoading === "yearly" ? "جاري..." : "اشترك سنوياً"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
