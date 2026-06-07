"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

export default function UpgradePage() {
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [email,  setEmail]  = useState<string>("");

  // تهيئة Paddle وجلب بيانات اليوزر
  useEffect(() => {
    initializePaddle({
      token:       process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment: "sandbox",
    }).then(setPaddle);

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  function openCheckout(priceId: string) {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || !paddle) return;

      paddle.Checkout.open({
        items:      [{ priceId, quantity: 1 }],
        customer:   { email },
        customData: { user_id: userId }, // يُرسل للـ webhook لربط الاشتراك باليوزر
      });
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold">ترقية الخطة</h1>
      <p className="text-gray-500">اختر الخطة المناسبة لك</p>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* خطة شهرية */}
        <button
          onClick={() => openCheckout(process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID!)}
          className="rounded-xl border-2 border-teal-600 px-8 py-4 text-lg font-semibold text-teal-600 hover:bg-teal-600 hover:text-white transition-colors"
        >
          اشترك شهرياً
        </button>

        {/* خطة سنوية */}
        <button
          onClick={() => openCheckout(process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID!)}
          className="rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          اشترك سنوياً
        </button>
      </div>
    </main>
  );
}
