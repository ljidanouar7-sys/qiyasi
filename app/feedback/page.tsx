"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error" | "already" | "notfound";

const OPTIONS = [
  { label: "👍 كان مناسباً تماماً", value: "fit_good",  color: "#10b981" },
  { label: "📏 كان ضيّقاً",          value: "too_tight", color: "#f59e0b" },
  { label: "📏 كان واسعاً",           value: "too_loose", color: "#3b82f6" },
];

function FeedbackContent() {
  const params  = useSearchParams();
  const rec_id  = params.get("rec") ?? "";
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!rec_id) setStatus("error");
  }, [rec_id]);

  async function submit(quick_feedback: string) {
    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rec_id, quick_feedback, feedback_type: "localStorage_return" }),
      });
      if (res.status === 409) { setStatus("already"); return; }
      if (res.status === 404) { setStatus("notfound"); return; }
      if (!res.ok)            { setStatus("error"); return; }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f8fafc",
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", direction: "rtl", padding: "24px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "40px 32px",
        maxWidth: "400px", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,.08)", textAlign: "center",
      }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📏</div>
        <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 28px" }}>قياسي — تقييم المقاس</p>

        {status === "idle" && (
          <>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>
              كيفاش كان مقاس المنتج اللي شريتي؟
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 28px" }}>
              تقييمك يساعدنا على تحسين التوصيات للجميع
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {OPTIONS.map(o => (
                <button key={o.value} onClick={() => submit(o.value)} style={{
                  padding: "14px 20px", borderRadius: "12px",
                  border: `2px solid ${o.color}20`, background: `${o.color}10`,
                  color: o.color, fontSize: "15px", fontWeight: 700, cursor: "pointer",
                }}>
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {status === "loading"  && <p style={{ color: "#64748b" }}>جاري الإرسال...</p>}

        {status === "success" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ color: "#10b981", fontWeight: 800, margin: "0 0 8px" }}>شكراً على تقييمك!</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>سيساعدنا على تحسين التوصيات للجميع</p>
          </>
        )}

        {status === "already" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✔️</div>
            <h2 style={{ color: "#64748b", fontWeight: 800 }}>تم استلام تقييمك مسبقاً</h2>
          </>
        )}

        {status === "notfound" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h2 style={{ color: "#ef4444", fontWeight: 800 }}>الرابط غير صالح</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>تأكد من الرابط وحاول مجدداً</p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ color: "#f59e0b", fontWeight: 800 }}>حدث خطأ</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>تأكد من الإنترنت وأعد المحاولة</p>
            <button onClick={() => setStatus("idle")} style={{
              marginTop: "16px", padding: "10px 24px", borderRadius: "10px",
              background: "#1e293b", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700,
            }}>
              أعد المحاولة
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "14px", color: "#94a3b8" }}>جاري التحميل...</div>
      </div>
    }>
      <FeedbackContent />
    </Suspense>
  );
}
