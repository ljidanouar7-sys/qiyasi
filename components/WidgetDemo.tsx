"use client";
import { useState } from "react";

const STEPS = [
  {
    id: "gender", q: "ما هو جنسك؟",
    type: "choice",
    options: [{ v: "female", label: "امرأة", icon: "👩" }, { v: "male", label: "رجل", icon: "👨" }]
  },
  {
    id: "height", q: "كم طولك؟", type: "number", unit: "سم", min: 130, max: 220, def: 165
  },
  {
    id: "weight", q: "كم وزنك؟", type: "number", unit: "كغ", min: 35, max: 200, def: 65
  },
  {
    id: "shoulders", q: "ما شكل كتفيك؟", type: "choice",
    options: [{ v: "wide", label: "عريضة", icon: "↔️" }, { v: "average", label: "متوسطة", icon: "➡️" }, { v: "narrow", label: "ضيقة", icon: "↕️" }]
  },
  {
    id: "belly", q: "ما شكل بطنك؟", type: "choice",
    options: [{ v: "flat", label: "مسطحة", icon: "▬" }, { v: "average", label: "متوسطة", icon: "◉" }, { v: "big", label: "بارزة", icon: "⭕" }]
  },
  {
    id: "hips", q: "ما شكل وركيك؟", type: "choice",
    options: [{ v: "narrow", label: "ضيق", icon: "📏" }, { v: "average", label: "متوسط", icon: "📐" }, { v: "wide", label: "عريض", icon: "🔲" }]
  },
];

function calcSize(answers: Record<string, string | number>) {
  const h = Number(answers.height) || 165;
  const w = Number(answers.weight) || 65;
  const bmi = w / Math.pow(h / 100, 2);
  let score = bmi < 18.5 ? 0 : bmi < 23 ? 1 : bmi < 27 ? 2 : 3;
  if (answers.shoulders === "wide") score += 0.5;
  if (answers.belly === "big") score += 0.5;
  if (answers.hips === "wide") score += 0.5;
  return ["S", "M", "L", "XL"][Math.min(3, Math.max(0, Math.round(score)))];
}

export default function WidgetDemo() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<string | null>(null);

  const s = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  function pick(val: string) {
    const updated = { ...answers, [s.id]: val };
    setAnswers(updated);
    if (step < STEPS.length - 1) setTimeout(() => setStep(step + 1), 200);
    else setResult(calcSize(updated));
  }

  function next() {
    const val = answers[s.id];
    if (!val) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else setResult(calcSize(answers));
  }

  function restart() { setStep(0); setAnswers({}); setResult(null); }

  if (result) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🎉</div>
        <p className="text-gray-500 mb-2">المقاس المناسب لك هو</p>
        <div className="text-7xl font-black gradient-text mb-4">{result}</div>
        <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
          بناءً على إجاباتك، ننصحك بمقاس <strong>{result}</strong>. إذا كنت بين مقاسين، اختر الأكبر.
        </p>
        <button onClick={restart} className="text-sm text-gray-500 hover:text-gray-700 underline transition">
          🔄 أعد الحساب
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>الخطوة {step + 1} من {STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="gradient-bg h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-6">{s.q}</h3>

      {s.type === "choice" && (
        <div className="flex gap-3 flex-wrap justify-center mb-6">
          {s.options?.map(o => (
            <button
              key={o.v}
              onClick={() => pick(o.v)}
              className={`flex-1 min-w-[100px] border-2 rounded-xl py-4 px-3 text-center transition font-bold text-sm
                ${answers[s.id] === o.v
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 text-gray-700 bg-white"}`}
            >
              <div className="text-2xl mb-1">{o.icon}</div>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {s.type === "number" && (
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setAnswers(a => ({ ...a, [s.id]: Math.max(s.min!, Number(a[s.id] || s.def!) - 1) }))}
            className="w-11 h-11 rounded-full border-2 border-blue-600 text-blue-600 font-black text-xl hover:bg-blue-50 transition"
          >−</button>
          <div className="text-center">
            <span className="text-4xl font-black text-gray-900">{answers[s.id] || s.def}</span>
            <span className="text-gray-500 text-lg mr-2">{s.unit}</span>
          </div>
          <button
            onClick={() => setAnswers(a => ({ ...a, [s.id]: Math.min(s.max!, Number(a[s.id] || s.def!) + 1) }))}
            className="w-11 h-11 rounded-full border-2 border-blue-600 text-blue-600 font-black text-xl hover:bg-blue-50 transition"
          >+</button>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className={`text-sm text-gray-500 hover:text-gray-800 transition ${step === 0 ? "invisible" : ""}`}
        >
          ← رجوع
        </button>
        {s.type === "number" && (
          <button onClick={next} className="gradient-bg text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition text-sm">
            {step === STEPS.length - 1 ? "✨ احسب مقاسي" : "التالي →"}
          </button>
        )}
        {s.type === "choice" && step === STEPS.length - 1 && answers[s.id] && (
          <button onClick={next} className="gradient-bg text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition text-sm">
            ✨ احسب مقاسي
          </button>
        )}
      </div>
    </div>
  );
}
