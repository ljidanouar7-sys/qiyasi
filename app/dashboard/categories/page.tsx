"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type QuizField = "height" | "weight" | "";

interface ChartColumn {
  id:         string;
  label:      string;
  quiz_field: QuizField;
  active?:    boolean;
}

interface ChartRow {
  size:  string;
  cells: Record<string, { min: string; max: string }>;
}

interface Category {
  id:         string;
  name:       string;
  tag:        string;
  niche:      string;
  size_chart: unknown;
}

// ── Measurement Metadata ───────────────────────────────────────────────────────

const MEASUREMENT_FIELDS: Record<string, {
  label: string; unit: string; quiz_field: QuizField;
  hint: string; emoji: string; color: string;
}> = {
  h:  { label: "الطول",  unit: "سم", quiz_field: "height", emoji: "↕️", color: "teal",   hint: "الطول الكامل من الرأس حتى القدم" },
  w:  { label: "الوزن",  unit: "كغ", quiz_field: "weight", emoji: "⚖️", color: "blue",   hint: "الوزن بالكيلوغرام" },
  ch: { label: "الصدر",  unit: "سم", quiz_field: "",       emoji: "📏", color: "blue",   hint: "محيط الصدر عند أوسع نقطة (تحت الإبط)" },
  wa: { label: "الخصر",  unit: "سم", quiz_field: "",       emoji: "📏", color: "violet", hint: "محيط الخصر عند أضيق نقطة" },
  hi: { label: "الورك",  unit: "سم", quiz_field: "",       emoji: "📏", color: "pink",   hint: "محيط الورك عند أوسع نقطة" },
};

// Fields per niche in display order
const NICHE_FIELDS: Record<string, string[]> = {
  abaya:  ["h", "ch", "wa", "hi"],
  jelaba: ["h", "ch", "wa", "hi"],
  dress:  ["h", "ch", "wa", "hi"],
  shirt:  ["ch", "wa", "h"],
  pants:  ["wa", "hi", "h"],
  jacket: ["ch", "wa", "hi", "h"],
  kids:   ["h", "w", "ch"],
  other:  ["h", "ch", "wa"],
};

// Body measurement columns (used for active toggle)
const BODY_COLS = ["ch", "wa", "hi"];

function nicheToColumns(niche: string, colActive: Record<string, boolean>): ChartColumn[] {
  const fieldIds = NICHE_FIELDS[niche] ?? NICHE_FIELDS.other;
  return fieldIds.map(id => {
    const meta = MEASUREMENT_FIELDS[id];
    return {
      id,
      label:      `${meta.label} (${meta.unit})`,
      quiz_field: meta.quiz_field,
      ...(BODY_COLS.includes(id) ? { active: colActive[id] !== false } : {}),
    };
  });
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ALL_SIZES = [
  "XS / 50", "S / 52", "M / 54", "L / 56",
  "XL / 58", "XXL / 60", "3XL / 62", "4XL / 64",
];

const NICHES = [
  { value: "abaya",   label: "👗 عبايات وجلابيب (ملابس طويلة)" },
  { value: "jelaba",  label: "🥻 جلابيات"                      },
  { value: "dress",   label: "👗 فساتين"                        },
  { value: "shirt",   label: "👕 قمصان وبلوزات"                },
  { value: "pants",   label: "👖 بناطيل وتنانير"               },
  { value: "jacket",  label: "🧥 جاكيتات وصترات"              },
  { value: "kids",    label: "👶 ملابس أطفال"                  },
  { value: "other",   label: "📦 أخرى"                         },
];

const NICHE_HINTS: Record<string, string> = {
  abaya:  "الطول هو الأساس — الخوارزمية ستعطيه أولوية قصوى (70-75%)",
  jelaba: "الطول مهم مع توازن في عرض الصدر والخصر",
  dress:  "الطول مهم مع مراعاة الصدر والورك",
  shirt:  "الصدر والكتفين أهم من الطول — الخوارزمية ستركز عليهم",
  pants:  "الخصر والورك أهم — الطول أقل تأثيراً (20-32%)",
  jacket: "توازن بين الطول والصدر والكتفين",
  kids:   "الطول مهم مع وزن الطفل",
  other:  "أوزان متوازنة بين الطول والعرض",
};

const DEFAULT_ROWS: ChartRow[] = [
  { size: "XS / 50",  cells: { h:{min:"145",max:"155"}, w:{min:"45",max:"55"},  ch:{min:"82",max:"88"},   wa:{min:"66",max:"72"},   hi:{min:"90",max:"96"}   } },
  { size: "S / 52",   cells: { h:{min:"155",max:"163"}, w:{min:"55",max:"67"},  ch:{min:"88",max:"96"},   wa:{min:"72",max:"80"},   hi:{min:"96",max:"104"}  } },
  { size: "M / 54",   cells: { h:{min:"163",max:"170"}, w:{min:"67",max:"78"},  ch:{min:"96",max:"104"},  wa:{min:"80",max:"88"},   hi:{min:"104",max:"112"} } },
  { size: "L / 56",   cells: { h:{min:"170",max:"178"}, w:{min:"78",max:"90"},  ch:{min:"104",max:"112"}, wa:{min:"88",max:"96"},   hi:{min:"112",max:"120"} } },
  { size: "XL / 58",  cells: { h:{min:"178",max:"185"}, w:{min:"90",max:"102"}, ch:{min:"112",max:"120"}, wa:{min:"96",max:"104"},  hi:{min:"120",max:"128"} } },
  { size: "XXL / 60", cells: { h:{min:"185",max:"193"}, w:{min:"102",max:"115"},ch:{min:"120",max:"128"}, wa:{min:"104",max:"112"}, hi:{min:"128",max:"136"} } },
  { size: "3XL / 62", cells: { h:{min:"193",max:"200"}, w:{min:"115",max:"125"},ch:{min:"128",max:"136"}, wa:{min:"112",max:"120"}, hi:{min:"136",max:"144"} } },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function chartToJson(cols: ChartColumn[], rows: ChartRow[]) {
  return {
    columns: cols,
    rows: rows.map(r => ({
      size: r.size,
      ...Object.fromEntries(
        cols.map(c => [c.id, {
          min: Number(r.cells[c.id]?.min || 0),
          max: Number(r.cells[c.id]?.max || 0),
        }])
      ),
    })),
  };
}

function jsonToRows(json: unknown, niche: string): ChartRow[] {
  const j = json as Record<string, unknown> | null;
  const fieldIds = NICHE_FIELDS[niche] ?? NICHE_FIELDS.other;
  if (!j || !Array.isArray(j.rows) || (j.rows as unknown[]).length === 0)
    return DEFAULT_ROWS;
  return (j.rows as Record<string, unknown>[]).map(r => ({
    size: String(r.size ?? ALL_SIZES[0]),
    cells: Object.fromEntries(
      fieldIds.map(id => [id, {
        min: String((r[id] as { min?: unknown })?.min ?? ""),
        max: String((r[id] as { max?: unknown })?.max ?? ""),
      }])
    ),
  }));
}

function emptyRow(niche: string): ChartRow {
  const fieldIds = NICHE_FIELDS[niche] ?? NICHE_FIELDS.other;
  return {
    size: ALL_SIZES[0],
    cells: Object.fromEntries(fieldIds.map(id => [id, { min: "", max: "" }])),
  };
}

// ── Body Diagram SVG ───────────────────────────────────────────────────────────

function BodyDiagram({ niche }: { niche: string }) {
  const fields = NICHE_FIELDS[niche] ?? [];
  const hasH  = fields.includes("h");
  const hasCh = fields.includes("ch");
  const hasWa = fields.includes("wa");
  const hasHi = fields.includes("hi");

  return (
    <div className="flex items-center gap-4 justify-center py-2">
      <svg viewBox="0 0 80 160" width="56" height="112">
        {/* Head */}
        <circle cx="40" cy="14" r="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
        {/* Torso */}
        <path d="M23 26 Q40 22 57 26 L54 90 Q40 95 26 90 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
        {/* Arms */}
        <path d="M23 30 L10 70" stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" fill="none"/>
        <path d="M57 30 L70 70" stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" fill="none"/>
        {/* Legs */}
        <path d="M30 90 L26 152" stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M50 90 L54 152" stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" fill="none"/>

        {/* Height arrow */}
        {hasH && <>
          <line x1="72" y1="3" x2="72" y2="154" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="3,2"/>
          <polyline points="69,7 72,1 75,7" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
          <polyline points="69,150 72,156 75,150" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
        </>}
        {/* Chest line */}
        {hasCh && <>
          <line x1="6" y1="44" x2="74" y2="44" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2"/>
          <circle cx="40" cy="44" r="2.5" fill="#3b82f6"/>
        </>}
        {/* Waist line */}
        {hasWa && <>
          <line x1="10" y1="66" x2="70" y2="66" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3,2"/>
          <circle cx="40" cy="66" r="2.5" fill="#8b5cf6"/>
        </>}
        {/* Hips line */}
        {hasHi && <>
          <line x1="8" y1="86" x2="72" y2="86" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3,2"/>
          <circle cx="40" cy="86" r="2.5" fill="#ec4899"/>
        </>}
      </svg>

      {/* Legend */}
      <div className="space-y-2">
        {hasH  && <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-teal-500"/><span className="text-xs text-slate-600 font-medium">الطول</span></div>}
        {hasCh && <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-blue-500"/><span className="text-xs text-slate-600 font-medium">الصدر</span></div>}
        {hasWa && <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-violet-500"/><span className="text-xs text-slate-600 font-medium">الخصر</span></div>}
        {hasHi && <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-pink-500"/><span className="text-xs text-slate-600 font-medium">الورك</span></div>}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [merchantId,   setMerchantId]   = useState<string | null>(null);
  const [merchantPlan, setMerchantPlan] = useState<string>("free");
  const [loading,      setLoading]      = useState(true);
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [editingCat,   setEditingCat]   = useState<Category | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [toast,        setToast]        = useState("");
  const [saving,       setSaving]       = useState(false);

  const [catName,    setCatName]    = useState("");
  const [catTag,     setCatTag]     = useState("");
  const [catNiche,   setCatNiche]   = useState("abaya");
  const [rows,       setRows]       = useState<ChartRow[]>(DEFAULT_ROWS);
  const [colActive,  setColActive]  = useState<Record<string, boolean>>({ ch: true, wa: true, hi: true });

  // Test modal
  const [testCat,     setTestCat]     = useState<Category | null>(null);
  const [testAnswers, setTestAnswers] = useState({
    height: "165", weight: "65",
    shoulders: "average", belly: "average",
    user_preference: "regular",
  });
  const [testResult, setTestResult] = useState<{
    size: string; status: string; message: string;
    reasoning?: string; disclaimer?: string;
    confidence?: number; alternatives?: string[];
    garmentType?: string; heightFactor?: number;
  } | null>(null);
  const [testError, setTestError] = useState("");
  const [testing,   setTesting]   = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    let { data: merchant } = await supabase.from("merchants").select("id, plan").eq("user_id", user.id).single();
    if (!merchant) {
      const { data: m } = await supabase.from("merchants").insert({ user_id: user.id, store_name: "متجري" }).select("id, plan").single();
      merchant = m;
    }
    if (merchant) {
      setMerchantId(merchant.id);
      setMerchantPlan(merchant.plan || "free");
      fetchCategories(merchant.id);
    }
    setLoading(false);
  }

  async function fetchCategories(mid: string) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, tag, niche, size_chart")
      .eq("merchant_id", mid)
      .order("created_at");
    if (data) setCategories(data as Category[]);
  }

  const OLD_NICHE_MAP: Record<string, string> = { long_clothing: "abaya", sports: "other" };

  function openNew() {
    setEditingCat(null);
    setCatName(""); setCatTag(""); setCatNiche("abaya");
    setColActive({ ch: true, wa: true, hi: true });
    setRows(DEFAULT_ROWS);
    setShowForm(true);
    setTimeout(() => document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatTag(cat.tag || "");
    const mappedNiche = OLD_NICHE_MAP[cat.niche] ?? cat.niche ?? "abaya";
    setCatNiche(mappedNiche);
    // Extract active states from existing JSON
    const j = cat.size_chart as { columns?: ChartColumn[] } | null;
    const newActive: Record<string, boolean> = { ch: true, wa: true, hi: true };
    if (j?.columns) {
      j.columns.forEach(col => {
        if (BODY_COLS.includes(col.id)) newActive[col.id] = col.active !== false;
      });
    }
    setColActive(newActive);
    setRows(jsonToRows(cat.size_chart, mappedNiche));
    setShowForm(true);
    setTimeout(() => document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function cancelForm() { setShowForm(false); setEditingCat(null); }

  function handleNicheChange(newNiche: string) {
    setCatNiche(newNiche);
    const fieldIds = NICHE_FIELDS[newNiche] ?? NICHE_FIELDS.other;
    setRows(r => r.map(row => ({
      ...row,
      cells: Object.fromEntries(
        fieldIds.map(id => [id, row.cells[id] ?? { min: "", max: "" }])
      ),
    })));
  }

  function toggleColActive(id: string) {
    setColActive(a => ({ ...a, [id]: a[id] === false ? true : false }));
  }

  function addSizeRow() {
    setRows(r => [...r, emptyRow(catNiche)]);
  }

  function removeRow(i: number) { setRows(r => r.filter((_, j) => j !== i)); }

  function updateRowSize(i: number, size: string) {
    setRows(r => r.map((row, j) => j === i ? { ...row, size } : row));
  }

  function updateCell(ri: number, colId: string, field: "min" | "max", value: string) {
    setRows(r => r.map((row, i) =>
      i !== ri ? row : {
        ...row,
        cells: { ...row.cells, [colId]: { ...row.cells[colId], [field]: value } },
      }
    ));
  }

  async function handleSave() {
    if (!catName.trim()) { alert("أدخل اسم الفئة"); return; }
    if (!catTag.trim())  { alert("أدخل الـ Tag"); return; }
    if (!merchantId) {
      setToast("❌ لم تتحمل بيانات المتجر — أعد تحميل الصفحة");
      setTimeout(() => setToast(""), 4000);
      return;
    }
    const sizeNames = rows.map(r => r.size);
    if (new Set(sizeNames).size !== sizeNames.length) {
      alert("يوجد مقاسات مكررة — تأكد من أن كل صف له مقاس مختلف");
      return;
    }
    if (!editingCat) {
      const MAX = merchantPlan === "pro" ? 50 : 3;
      if (categories.length >= MAX) {
        setToast(`❌ وصلت للحد الأقصى (${MAX} فئات)`);
        setTimeout(() => setToast(""), 5000);
        return;
      }
    }
    setSaving(true);
    try {
      const activeCols = nicheToColumns(catNiche, colActive);
      const payload = {
        merchant_id: merchantId,
        name:        catName.trim(),
        tag:         catTag.trim().replace(/\s+/g, "-"),
        niche:       catNiche,
        size_chart:  chartToJson(activeCols, rows),
      };
      const { error } = editingCat
        ? await supabase.from("categories").update(payload).eq("id", editingCat.id)
        : await supabase.from("categories").insert(payload);
      if (error) {
        setToast(`❌ خطأ في الحفظ: ${error.message}`);
        setTimeout(() => setToast(""), 6000);
        return;
      }
      setToast(editingCat ? "✅ تم التعديل" : "✅ تم الحفظ");
      setTimeout(() => setToast(""), 3000);
      setShowForm(false);
      fetchCategories(merchantId);
    } catch {
      setToast("❌ خطأ في الاتصال — تحقق من الإنترنت");
      setTimeout(() => setToast(""), 6000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه الفئة نهائياً؟")) return;
    await supabase.from("categories").delete().eq("id", id);
    if (merchantId) fetchCategories(merchantId);
  }

  async function handleTest() {
    if (!testCat) return;
    setTesting(true); setTestResult(null); setTestError("");
    const res = await fetch("/api/merchant/test-size", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag: testCat.tag,
        answers: {
          height:    testAnswers.height,
          weight:    testAnswers.weight,
          shoulders: testAnswers.shoulders,
          belly:     testAnswers.belly,
        },
        user_preference: testAnswers.user_preference,
      }),
    });
    const data = await res.json();
    if (!res.ok) setTestError(data.error || "حدث خطأ");
    else setTestResult(data);
    setTesting(false);
  }

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm font-bold">جاري التحميل...</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const currentFieldIds = NICHE_FIELDS[catNiche] ?? NICHE_FIELDS.other;
  const bodyColsInNiche = currentFieldIds.filter(id => BODY_COLS.includes(id));

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">الفئات</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">فئات المنتجات</h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">أنشئ فئة لكل مجموعة منتجات تشترك في نفس جدول المقاسات</p>
      </div>

      {/* How-it-works banner */}
      {!showForm && (
        <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-xl mb-6">
          <h3 className="text-base font-black text-blue-800 mb-2">🔗 كيف تربط منتجاتك بجدول المقاسات؟</h3>
          <p className="text-sm text-slate-700 mb-3">
            كل فئة مقاسات لها <strong>رمز خاص</strong> (مثلاً <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-xs">abayas</code>).
            هذا الرمز هو ما يخبر الأداة بأي جدول مقاسات يجب استخدامه.
          </p>
          <div className="bg-white p-3 rounded-xl border border-blue-100 mb-3 space-y-1.5">
            <p className="font-bold text-slate-800 text-sm">📌 مثال عملي:</p>
            <p className="text-sm text-slate-700">لديك <strong>20 منتجاً من العبايات</strong> — أنشئ فئة واحدة برمز <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">abayas</code> وضع نفس الرمز على كل المنتجات.</p>
          </div>
          <p className="text-xs text-slate-500">💡 رمز واحد يكفي لجميع المنتجات المتشابهة.</p>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl whitespace-nowrap ${
          toast.startsWith("❌") ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}>
          {toast}
        </div>
      )}

      {!showForm && (
        <div className="flex justify-end mb-5">
          <button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition">
            + فئة جديدة
          </button>
        </div>
      )}

      {/* ── FORM ── */}
      {showForm && (
        <div id="form-top" className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-base md:text-lg">
              {editingCat ? `تعديل: ${editingCat.name}` : "فئة جديدة"}
            </h2>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">✕</button>
          </div>

          <div className="p-4 md:p-6 space-y-5">

            {!editingCat && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                <p className="text-sm font-black text-teal-800 mb-0.5">📋 جدول افتراضي جاهز</p>
                <p className="text-xs text-teal-700">تم تعبئة الجدول بمعايير عالمية — عدّل القيم حسب منتجاتك.</p>
              </div>
            )}

            {/* Name + Niche */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">اسم الفئة</label>
                <input
                  type="text" placeholder="مثال: عبايات حرير فاخرة"
                  value={catName} onChange={e => setCatName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">نوع الملابس</label>
                <select
                  value={catNiche} onChange={e => handleNicheChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 bg-white transition"
                >
                  {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                {NICHE_HINTS[catNiche] && (
                  <p className="text-xs text-teal-700 mt-1.5 bg-teal-50 px-3 py-1.5 rounded-lg">
                    ⚙️ {NICHE_HINTS[catNiche]}
                  </p>
                )}
              </div>
            </div>

            {/* Tag */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-0.5">رمز الفئة</label>
              <p className="text-xs text-slate-400 mb-1.5">كود قصير تضيفه على منتجات متجرك</p>
              <input
                type="text" placeholder="مثال: silk-abayas" dir="ltr"
                value={catTag} onChange={e => setCatTag(e.target.value.replace(/\s/g, "-"))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
              />
            </div>

            {/* ── Visual Size Chart ── */}
            <div>
              <p className="font-black text-slate-900 text-sm mb-1">📊 جدول المقاسات</p>
              <p className="text-xs text-slate-400 mb-4">
                الحقول المعروضة: {currentFieldIds.map(id => MEASUREMENT_FIELDS[id]?.label).join(" · ")}
              </p>

              {/* Body diagram */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 text-center mb-3">أين تقاس كل قياس؟</p>
                <BodyDiagram niche={catNiche} />
              </div>

              {/* Active toggles for body cols */}
              {bodyColsInNiche.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">القياسات المستخدمة في الحساب:</p>
                  <div className="flex gap-2 flex-wrap">
                    {bodyColsInNiche.map(id => (
                      <button
                        key={id}
                        onClick={() => toggleColActive(id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                          colActive[id] !== false
                            ? "bg-teal-50 text-teal-700 border-teal-300"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {colActive[id] !== false ? "⚙️" : "👁"} {MEASUREMENT_FIELDS[id].label}
                        {colActive[id] !== false ? " — يحسب" : " — عرض فقط"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size cards */}
              <div className="space-y-3">
                {rows.map((row, ri) => {
                  return (
                    <div key={ri} className="border border-slate-200 rounded-2xl overflow-hidden">
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">المقاس</span>
                          <select
                            value={row.size}
                            onChange={e => updateRowSize(ri, e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-sm font-black text-teal-700 focus:outline-none focus:border-teal-400 bg-white"
                          >
                            {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <button
                          onClick={() => removeRow(ri)}
                          className="text-slate-300 hover:text-red-400 text-lg leading-none transition"
                        >✕</button>
                      </div>

                      {/* Measurement fields grid */}
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {currentFieldIds.map(id => {
                          const meta = MEASUREMENT_FIELDS[id];
                          if (!meta) return null;
                          const cell = row.cells[id] ?? { min: "", max: "" };
                          const isInvalid = !!(cell.min && cell.max && Number(cell.min) >= Number(cell.max));
                          const isInactive = BODY_COLS.includes(id) && colActive[id] === false;

                          // color classes per field
                          const colors: Record<string, string> = {
                            h:  "border-teal-100 bg-teal-50/30",
                            w:  "border-blue-100 bg-blue-50/30",
                            ch: "border-blue-100 bg-blue-50/30",
                            wa: "border-violet-100 bg-violet-50/30",
                            hi: "border-pink-100 bg-pink-50/30",
                          };
                          const dotColors: Record<string, string> = {
                            h:  "bg-teal-500", w: "bg-blue-500",
                            ch: "bg-blue-500", wa: "bg-violet-500", hi: "bg-pink-500",
                          };

                          return (
                            <div
                              key={id}
                              className={`rounded-xl border p-3 transition ${
                                isInvalid ? "border-red-200 bg-red-50"
                                : isInactive ? "border-slate-100 bg-slate-50 opacity-50"
                                : (colors[id] ?? "border-slate-100")
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[id] ?? "bg-slate-400"}`}/>
                                <span className="text-xs font-black text-slate-700">{meta.label}</span>
                                <span className="text-xs text-slate-400 mr-auto">{meta.unit}</span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2.5 leading-tight">{meta.hint}</p>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1">
                                  <p className="text-xs text-slate-400 mb-0.5 text-center">من</p>
                                  <input
                                    type="number" placeholder="0"
                                    value={cell.min}
                                    onChange={e => updateCell(ri, id, "min", e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:border-teal-400 bg-white"
                                  />
                                </div>
                                <span className="text-slate-300 text-sm mt-4">—</span>
                                <div className="flex-1">
                                  <p className="text-xs text-slate-400 mb-0.5 text-center">إلى</p>
                                  <input
                                    type="number" placeholder="0"
                                    value={cell.max}
                                    onChange={e => updateCell(ri, id, "max", e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:border-teal-400 bg-white"
                                  />
                                </div>
                              </div>
                              {isInvalid && (
                                <p className="text-xs text-red-500 mt-1.5 text-center">⚠️ الحد الأدنى أكبر من الأعلى</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={addSizeRow}
                className="mt-3 w-full border-2 border-dashed border-teal-200 hover:border-teal-400 text-teal-600 hover:text-teal-700 font-bold text-sm py-3 rounded-xl transition"
              >
                + إضافة مقاس
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleSave} disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-black text-sm transition flex-1 sm:flex-none disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : editingCat ? "حفظ التعديلات" : "حفظ الفئة"}
              </button>
              <button onClick={cancelForm} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold text-sm transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category List ── */}
      <div className="space-y-3">
        {categories.length === 0 && !showForm && (
          <div className="bg-white border border-slate-100 rounded-2xl p-10 md:p-12 text-center">
            <p className="text-4xl mb-3">📐</p>
            <p className="text-slate-500 font-bold mb-1">لا توجد فئات بعد</p>
            <p className="text-slate-400 text-sm mb-5">أنشئ فئة لكل مجموعة منتجات تشترك في نفس جدول المقاسات</p>
            <button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition">
              + أضف فئتك الأولى
            </button>
          </div>
        )}

        {categories.map(cat => {
          const j = cat.size_chart as { columns?: ChartColumn[]; rows?: unknown[] } | null;
          const matchCols = (j?.columns ?? []).filter(c => c.quiz_field).length;
          const hasRows   = (j?.rows ?? []).length > 0;
          const hasTag    = !!cat.tag?.trim();
          const isReady   = hasTag && matchCols > 0 && hasRows;
          const niche     = NICHES.find(n => n.value === cat.niche);
          return (
            <div key={cat.id} className={`bg-white border rounded-2xl px-4 py-4 shadow-sm ${isReady ? "border-slate-100" : "border-amber-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-slate-900 truncate">{cat.name}</p>
                    {isReady
                      ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">✅ جاهزة</span>
                      : <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">⚠️ تحتاج إعداد</span>
                    }
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {hasTag
                      ? <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">{cat.tag}</span>
                      : <span className="bg-red-50 text-red-500 text-xs font-bold px-2.5 py-0.5 rounded-full">❌ بدون رمز</span>
                    }
                    {niche && (
                      <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 rounded-full">{niche.label}</span>
                    )}
                    {matchCols > 0
                      ? <span className="text-slate-400 text-xs">📊 {matchCols} عمود حساب</span>
                      : <span className="text-amber-500 text-xs font-semibold">⚠️ لا يوجد عمود حساب</span>
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setTestCat(cat); setTestResult(null); setTestError(""); }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-lg transition"
                  >🧪 جرّب</button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg transition"
                  >تعديل</button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-slate-300 hover:text-red-500 text-sm px-2 py-2 rounded-lg transition"
                  >🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TEST MODAL ── */}
      {testCat && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setTestCat(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="font-black text-slate-900 text-sm">🧪 تجربة الأداة</p>
                <p className="text-xs text-slate-400 mt-0.5">{testCat.name}</p>
              </div>
              <button onClick={() => setTestCat(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الطول (سم)</label>
                  <input type="number" value={testAnswers.height}
                    onChange={e => setTestAnswers(a => ({ ...a, height: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الوزن (كغ)</label>
                  <input type="number" value={testAnswers.weight}
                    onChange={e => setTestAnswers(a => ({ ...a, weight: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الكتفين</label>
                <select value={testAnswers.shoulders} onChange={e => setTestAnswers(a => ({ ...a, shoulders: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white">
                  <option value="wide">عريضة</option>
                  <option value="average">متوسطة</option>
                  <option value="narrow">ضيقة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">البطن</label>
                <select value={testAnswers.belly} onChange={e => setTestAnswers(a => ({ ...a, belly: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white">
                  <option value="flat">مسطحة</option>
                  <option value="average">متوسطة</option>
                  <option value="big">بارزة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">كيف تفضل المقاس؟</label>
                <select value={testAnswers.user_preference} onChange={e => setTestAnswers(a => ({ ...a, user_preference: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white">
                  <option value="fitted">مقيد</option>
                  <option value="regular">عادي</option>
                  <option value="loose">واسع</option>
                </select>
              </div>

              {testResult && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-teal-600 font-bold mb-1">المقاس الموصى به</p>
                  <p className="text-3xl font-black text-teal-700">{testResult.size}</p>
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    {testResult.confidence !== undefined && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        testResult.confidence >= 80 ? "bg-emerald-100 text-emerald-700"
                          : testResult.confidence >= 60 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                      }`}>ثقة {testResult.confidence}%</span>
                    )}
                    {testResult.alternatives && testResult.alternatives.length > 0 && (
                      <span className="text-xs text-slate-400">بدائل: {testResult.alternatives.join(" · ")}</span>
                    )}
                  </div>
                  {testResult.garmentType && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      نوع: <span className="font-bold text-slate-600">{testResult.garmentType}</span>
                      {testResult.heightFactor !== undefined && (
                        <> · طول <span className="font-bold text-slate-600">{Math.round(testResult.heightFactor * 100)}%</span></>
                      )}
                    </p>
                  )}
                  {testResult.message && <p className="text-xs text-slate-600 mt-2">{testResult.message}</p>}
                  {testResult.reasoning && (
                    <p className="text-xs text-slate-400 mt-2 italic border-t border-teal-100 pt-2">💡 {testResult.reasoning}</p>
                  )}
                  {testResult.disclaimer && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">ℹ️ {testResult.disclaimer}</p>
                  )}
                </div>
              )}

              {testError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-red-600 font-bold">❌ {testError}</p>
                </div>
              )}

              <button onClick={handleTest} disabled={testing}
                className="w-full bg-slate-900 hover:bg-slate-700 text-white font-black py-3 rounded-xl text-sm transition disabled:opacity-50">
                {testing ? "⏳ جاري الحساب..." : "احسب المقاس"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
