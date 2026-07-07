"use client";

import { useEffect, useState } from "react";
import { supabase }            from "@/lib/supabase";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

export default function UpgradePage() {
  const [loading,         setLoading]         = useState(true);
  const [isShopify,       setIsShopify]       = useState(false);
  const [paddle,          setPaddle]          = useState<Paddle | undefined>();
  const [email,           setEmail]           = useState("");
  const [errorMsg,        setErrorMsg]        = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "yearly" | null>(null);

  useEffect(() => {
    // اقرا error من URL إيلا كان
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setErrorMsg(err);

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/auth"; return; }
        setEmail(user.email ?? "");

        const { data: merchant } = await supabase
          .from("merchants")
          .select("shop_domain")
          .eq("user_id", user.id)
          .single();

        if (merchant?.shop_domain) {
          // تاجر Shopify — ما نحتاجوش Paddle
          setIsShopify(true);
        } else {
          // تاجر عادي — هيّئ Paddle
          try {
            const p = await initializePaddle({
              token:       process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
              environment: "production",
            });
            if (p) setPaddle(p);
          } catch (e) {
            console.error("[Upgrade] Paddle init:", e);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  function openCheckout(priceId: string, cycle: "monthly" | "yearly") {
    if (!paddle || !email) return;
    setCheckoutLoading(cycle);
    paddle.Checkout.open({
      items:    [{ priceId, quantity: 1 }],
      customer: { email },
      settings: { displayMode: "overlay", theme: "light", locale: "ar" },
    });
    setCheckoutLoading(null);
  }

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </main>
  );

  /* ───── تاجر Shopify ───── */
  if (isShopify) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5">⭐</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">انتهت التجربة المجانية</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            للاستمرار في استخدام قياسي، اشترك عبر Shopify.<br />
            $19/شهر — يُفوتر مباشرة من حساب Shopify الخاص بك.
          </p>

          {errorMsg && (
            <p className="text-red-600 text-xs font-bold mb-4 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
              حدث خطأ: {errorMsg}
            </p>
          )}

          <a
            href="/api/shopify/billing"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-black
                       px-8 py-4 rounded-xl transition text-base w-full text-center"
          >
            اشترك عبر Shopify — $19/شهر
          </a>

          <p className="text-slate-400 text-xs mt-4">
            الدفع يتم بأمان عبر Shopify Payments
          </p>
        </div>
      </main>
    );
  }

  /* ───── تاجر عادي (Paddle) ───── */
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8" dir="rtl">
      <div className="text-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">ترقية الخطة</h1>
        <p className="text-slate-500 text-sm">اختر الخطة المناسبة لك</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => openCheckout(process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID!, "monthly")}
          disabled={!!checkoutLoading}
          className="rounded-xl border-2 border-teal-600 px-8 py-4 text-lg font-semibold
                     text-teal-600 hover:bg-teal-600 hover:text-white transition-colors disabled:opacity-50"
        >
          {checkoutLoading === "monthly" ? "جاري..." : "اشترك شهرياً — $15"}
        </button>

        <button
          onClick={() => openCheckout(process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID!, "yearly")}
          disabled={!!checkoutLoading}
          className="rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold
                     text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {checkoutLoading === "yearly" ? "جاري..." : "اشترك سنوياً — $150"}
        </button>
      </div>
    </main>
  );
}
