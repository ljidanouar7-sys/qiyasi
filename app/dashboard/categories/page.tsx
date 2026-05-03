"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type QuizField = "height" | "weight" | "";

interface ChartColumn {
  id:         string;
  label:      string;
  quiz_field: QuizField;
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

// ── Constants ──────────────────────────────────────────────────────────────────

const ALL_SIZES = ["XS / 50", "S / 52", "M / 54", "L / 56", "XL / 58", "XXL / 60", "3XL / 62", "4XL / 64"];

const NICHES = [
  { value: "long_clothing", label: "👗 ملابس طويلة (عبايات، جلابيب)" },
  { value: "kids",          label: "👶 ملابس أطفال"                  },
  { value: "sports",        label: "🏃 ملابس رياضية"                 },
  { value: "other",         label: "📦 أخرى"                        },
];

const DEFAULT_COLS: ChartColumn[] = [
  { id: "h",  label: "الطول (سم)", quiz_field: "height" },
  { id: "w",  label: "الوزن (كغ)", quiz_field: "weight" },
  { id: "ch", label: "الصدر (سم)", quiz_field: ""       },
  { id: "wa", label: "الخصر (سم)", quiz_field: ""       },
  { id: "hi", label: "الورك (سم)", quiz_field: ""       },
];

const DEFAULT_ROWS: ChartRow[] = [
  { size:"XS / 50", cells:{ h:{min:"145",max:"155"}, w:{min:"45",max:"55"},  ch:{min:"82",max:"88"},   wa:{min:"66",max:"72"},   hi:{min:"90",max:"96"}   } },
  { size:"S / 52",  cells:{ h:{min:"155",max:"163"}, w:{min:"55",max:"67"},  ch:{min:"88",max:"96"},   wa:{min:"72",max:"80"},   hi:{min:"96",max:"104"}  } },
  { size:"M / 54",  cells:{ h:{min:"163",max:"170"}, w:{min:"67",max:"78"},  ch:{min:"96",max:"104"},  wa:{min:"80",max:"88"},   hi:{min:"104",max:"112"} } },
  { size:"L / 56",  cells:{ h:{min:"170",max:"178"}, w:{min:"78",max:"90"},  ch:{min:"104",max:"112"}, wa:{min:"88",max:"96"},   hi:{min:"112",max:"120"} } },
  { size:"XL / 58", cells:{ h:{min:"178",max:"185"}, w:{min:"90",max:"102"}, ch:{min:"112",max:"120"}, wa:{min:"96",max:"104"},  hi:{min:"120",max:"128"} } },
  { size:"XXL / 60",cells:{ h:{min:"185",max:"193"}, w:{min:"102",max:"115"},ch:{min:"120",max:"128"}, wa:{min:"104",max:"112"}, hi:{min:"128",max:"136"} } },
  { size:"3XL / 62",cells:{ h:{min:"193",max:"200"}, w:{min:"115",max:"125"},ch:{min:"128",max:"136"}, wa:{min:"112",max:"120"}, hi:{min:"136",max:"144"} } },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 8); }

function chartToJson(cols: ChartColumn[], rows: ChartRow[]) {
  return {
    columns: cols,
    rows: rows.map(r => ({
      size: r.size,
      ...Object.fromEntries(
        cols.map(c => [c.id, { min: Number(r.cells[c.id]?.min || 0), max: Number(r.cells[c.id]?.max || 0) }])
      ),
    })),
  };
}

function jsonToChart(json: unknown): { cols: ChartColumn[]; rows: ChartRow[] } {
  const j = json as Record<string, unknown> | null;
  if (!j || !Array.isArray(j.columns) || !Array.isArray(j.rows))
    return { cols: DEFAULT_COLS, rows: DEFAULT_ROWS };

  const cols = j.columns as ChartColumn[];
  const rows = (j.rows as Record<string, unknown>[]).map(r => ({
    size: r.size as string,
    cells: Object.fromEntries(
      cols.map(c => [
        c.id,
        {
          min: String((r[c.id] as Record<string, unknown>)?.min ?? ""),
          max: String((r[c.id] as Record<string, unknown>)?.max ?? ""),
        },
      ])
    ),
  }));
  return { cols, rows };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [merchantId,   setMerchantId]   = useState<string | null>(null);
  const [merchantPlan, setMerchantPlan] = useState<string>("free");
  const [loading,      setLoading]      = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [toast,      setToast]      = useState("");
  const [saving,     setSaving]     = useState(false);

  const [catName,  setCatName]  = useState("");
  const [catTag,   setCatTag]   = useState("");
  const [catNiche, setCatNiche] = useState("long_clothing");
  const [cols,            setCols]            = useState<ChartColumn[]>(DEFAULT_COLS);
  const [rows,            setRows]            = useState<ChartRow[]>(DEFAULT_ROWS);

  // Test modal state
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

  function openNew() {
    setEditingCat(null);
    setCatName(""); setCatTag(""); setCatNiche("long_clothing");
    setCols(DEFAULT_COLS); setRows(DEFAULT_ROWS);
    setShowForm(true);
    setTimeout(() => document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatTag(cat.tag || "");
    setCatNiche(cat.niche || "long_clothing");
    const { cols: c, rows: r } = jsonToChart(cat.size_chart);
    setCols(c); setRows(r);
    setShowForm(true);
    setTimeout(() => document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function cancelForm() { setShowForm(false); setEditingCat(null); }

  async function handleSave() {
    if (!catName.trim()) { alert("أدخل اسم الفئة"); return; }
    if (!catTag.trim())  { alert("أدخل الـ Tag"); return; }
    if (!merchantId) return;
    const sizeNames = rows.map(r => r.size);
    if (new Set(sizeNames).size !== sizeNames.length) {
      alert("يوجد مقاسات مكررة في الجدول — تأكد من أن كل صف له مقاس مختلف");
      return;
    }
    if (!editingCat) {
      const MAX = merchantPlan === "pro" ? 50 : 3;
      if (categories.length >= MAX) {
        setToast(`❌ وصلت للحد الأقصى (${MAX} فئات) — ${merchantPlan === "pro" ? "تواصل معنا للرفع" : "رقّي للباقة Pro باش تضيف أكثر"}`);
        setTimeout(() => setToast(""), 5000);
        return;
      }
    }

    setSaving(true);
    const payload = {
      merchant_id:          merchantId,
      name:  catName.trim(),
      tag:   catTag.trim().replace(/\s+/g, "-"),
      niche: catNiche,
      size_chart:           chartToJson(cols, rows),
    };
    if (editingCat) {
      await supabase.from("categories").update(payload).eq("id", editingCat.id);
    } else {
      await supabase.from("categories").insert(payload);
    }
    setSaving(false);
    setToast(editingCat ? "✅ تم التعديل" : "✅ تم الحفظ");
    setTimeout(() => setToast(""), 3000);
    setShowForm(false);
    fetchCategories(merchantId);
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه الفئة نهائياً؟")) return;
    await supabase.from("categories").delete().eq("id", id);
    if (merchantId) fetchCategories(merchantId);
  }

  function addColumn() {
    const id = uid();
    setCols(c => [...c, { id, label: "قياس جديد", quiz_field: "" }]);
    setRows(r => r.map(row => ({ ...row, cells: { ...row.cells, [id]: { min: "", max: "" } } })));
  }

  function removeColumn(id: string) {
    setCols(c => c.filter(col => col.id !== id));
    setRows(r => r.map(row => { const cells = { ...row.cells }; delete cells[id]; return { ...row, cells }; }));
  }

  function updateColumn(id: string, patch: Partial<ChartColumn>) {
    setCols(c => c.map(col => col.id === id ? { ...col, ...patch } : col));
  }

  function addSizeRow() {
    const emptyCells = Object.fromEntries(cols.map(c => [c.id, { min: "", max: "" }]));
    setRows(r => [...r, { size: ALL_SIZES[0], cells: emptyCells }]);
  }

  function removeRow(i: number) { setRows(r => r.filter((_, j) => j !== i)); }

  function updateRowSize(i: number, size: string) {
    setRows(r => r.map((row, j) => j === i ? { ...row, size } : row));
  }

  function updateCell(ri: number, colId: string, field: "min" | "max", value: string) {
    setRows(r => r.map((row, i) =>
      i !== ri ? row : { ...row, cells: { ...row.cells, [colId]: { ...row.cells[colId], [field]: value } } }
    ));
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

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">الفئات</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">فئات المنتجات</h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">أنشئ فئة لكل مجموعة منتجات تشترك في نفس جدول المقاسات</p>
      </div>

      {/* ── How-it-works banner ── */}
      {!showForm && (
        <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-xl mb-6">
          <h3 className="text-base font-black text-blue-800 mb-2">🔗 كيف تربط منتجاتك بجدول المقاسات؟</h3>
          <p className="text-sm text-slate-700 mb-3">
            كل فئة مقاسات لها <strong>رمز خاص</strong> (مثلاً <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-xs">abayas</code>).
            هذا الرمز هو ما يخبر الأداة بأي جدول مقاسات يجب استخدامه.
          </p>
          <div className="bg-white p-3 rounded-xl border border-blue-100 mb-3 space-y-1.5">
            <p className="font-bold text-slate-800 text-sm">📌 مثال عملي:</p>
            <p className="text-sm text-slate-700">
              لديك <strong>20 منتجاً من العبايات</strong> (سوداء، زرقاء، مخملية...).
            </p>
            <p className="text-sm text-slate-700">
              أنشأت فئة اسمها <strong className="text-emerald-700">"عبايات نسائية"</strong> وأعطيتها الرمز{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">abayas</code>.
            </p>
            <p className="text-sm text-slate-700">
              الآن في متجرك، ضع نفس الرمز{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">abayas</code>{" "}
              على كل منتج من هذه العبايات — وتعرف الأداة تلقائياً أي جدول مقاسات تستخدم.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            💡 <strong>ملاحظة:</strong> لا تحتاج جدول مقاسات لكل منتج — رمز واحد يكفي لجميع المنتجات المتشابهة.
          </p>
        </div>
      )}

      {toast && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm px-4 py-3 rounded-xl">
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
                <p className="text-xs text-teal-700 leading-relaxed">
                  تم تعبئة الجدول تلقائياً بمعايير عالمية للملابس الطويلة. يمكنك تعديل أي قيمة أو إضافة / حذف أعمدة وصفوف.
                </p>
              </div>
            )}

            {/* Basic info: Name + Niche */}
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
                <label className="block text-xs font-bold text-slate-500 mb-1.5">نوع النيش</label>
                <select
                  value={catNiche} onChange={e => setCatNiche(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 bg-white transition"
                >
                  {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
            </div>

            {/* Tag */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-0.5">رمز الفئة</label>
              <p className="text-xs text-slate-400 mb-1.5">
                كود قصير تضيفه على منتجات متجرك — لكي يعرف الـ AI أي جدول مقاسات يطبّق
              </p>
              <input
                type="text" placeholder="مثال: silk-abayas" dir="ltr"
                value={catTag} onChange={e => setCatTag(e.target.value.replace(/\s/g, "-"))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
              />
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-black text-amber-800 mb-1">📌 كيف تستخدم رمز الفئة؟</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  عندك 20 عباية حريرية؟ حط عليهم كلهم رمز واحد في متجرك مثل{" "}
                  <code className="bg-amber-100 px-1 rounded font-mono">silk-abayas</code>{" "}
                  — قياسي يجيب جدول مقاساتهم تلقائياً.<br/>
                  <strong>لا تستخدم اسم منتج واحد</strong> — الرمز يجب يغطي مجموعة كاملة.
                </p>
              </div>
            </div>

            {/* Size chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-black text-slate-900 text-sm">📊 جدول المقاسات</p>
                  <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                    الأعمدة المحددة بـ "🔗 يطابق..." تُستخدم في حساب المقاس — الباقي للعرض فقط
                  </p>
                </div>
                <button
                  onClick={addColumn}
                  className="text-teal-600 hover:text-teal-800 text-xs font-bold border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition flex-shrink-0"
                >
                  + عمود
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 -mx-1">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-right px-3 py-2.5 text-xs font-bold text-slate-500 w-28 border-b border-slate-200 sticky right-0 bg-slate-50 z-10">
                        المقاس
                      </th>
                      {cols.map(col => (
                        <th key={col.id} className="px-2 py-2 min-w-[160px] border-b border-slate-200">
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={col.label}
                              onChange={e => updateColumn(col.id, { label: e.target.value })}
                              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-teal-400"
                            />
                            <div className="flex items-center gap-1">
                              <select
                                value={col.quiz_field}
                                onChange={e => updateColumn(col.id, { quiz_field: e.target.value as QuizField })}
                                className="flex-1 border border-slate-200 rounded-lg px-1 py-1 text-xs focus:outline-none focus:border-teal-400 bg-white"
                              >
                                <option value="">📋 للعرض فقط</option>
                                <option value="height">🔗 يطابق الطول</option>
                                <option value="weight">🔗 يطابق الوزن</option>
                              </select>
                              <button
                                onClick={() => removeColumn(col.id)}
                                className="text-slate-300 hover:text-red-500 font-bold text-base leading-none transition flex-shrink-0"
                              >✕</button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, ri) => (
                      <tr key={ri} className="group hover:bg-slate-50 transition">
                        <td className="px-2 py-2 sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-100 transition">
                          <div className="flex items-center gap-1">
                            <select
                              value={row.size}
                              onChange={e => updateRowSize(ri, e.target.value)}
                              className="border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-black text-teal-700 focus:outline-none focus:border-teal-400 w-[80px]"
                            >
                              {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button
                              onClick={() => removeRow(ri)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 font-black text-base leading-none transition"
                            >✕</button>
                          </div>
                        </td>
                        {cols.map(col => (
                          <td key={col.id} className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number" placeholder="من"
                                value={row.cells[col.id]?.min ?? ""}
                                onChange={e => updateCell(ri, col.id, "min", e.target.value)}
                                className="w-14 border border-slate-200 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-teal-400"
                              />
                              <span className="text-slate-300 text-xs">—</span>
                              <input
                                type="number" placeholder="إلى"
                                value={row.cells[col.id]?.max ?? ""}
                                onChange={e => updateCell(ri, col.id, "max", e.target.value)}
                                className="w-14 border border-slate-200 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-teal-400"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addSizeRow}
                className="mt-3 w-full border-2 border-dashed border-teal-200 hover:border-teal-400 text-teal-600 font-bold text-sm py-2.5 rounded-xl transition"
              >
                + إضافة مقاس
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleSave} disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-black text-sm transition flex-1 sm:flex-none"
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
          const { cols: c, rows: r } = jsonToChart(cat.size_chart);
          const matchCols  = c.filter(col => col.quiz_field).length;
          const hasRows    = r.length > 0;
          const hasTag     = !!cat.tag?.trim();
          const isReady    = hasTag && matchCols > 0 && hasRows;
          const niche = NICHES.find(n => n.value === cat.niche);
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
                      <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 rounded-full">
                        {niche.label}
                      </span>
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
                  >
                    🧪 جرّب
                  </button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-slate-300 hover:text-red-500 text-sm px-2 py-2 rounded-lg transition"
                  >
                    🗑
                  </button>
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
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="font-black text-slate-900 text-sm">🧪 تجربة الأداة</p>
                <p className="text-xs text-slate-400 mt-0.5">{testCat.name}</p>
              </div>
              <button onClick={() => setTestCat(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {/* Form */}
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

              {/* Result */}
              {testResult && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-teal-600 font-bold mb-1">المقاس الموصى به</p>
                  <p className="text-3xl font-black text-teal-700">{testResult.size}</p>

                  {/* Confidence + alternatives */}
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    {testResult.confidence !== undefined && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        testResult.confidence >= 80 ? "bg-emerald-100 text-emerald-700"
                          : testResult.confidence >= 60 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        ثقة {testResult.confidence}%
                      </span>
                    )}
                    {testResult.alternatives && testResult.alternatives.length > 0 && (
                      <span className="text-xs text-slate-400">
                        بدائل: {testResult.alternatives.join(" · ")}
                      </span>
                    )}
                  </div>

                  {testResult.message && (
                    <p className="text-xs text-slate-600 mt-2">{testResult.message}</p>
                  )}
                  {testResult.reasoning && (
                    <p className="text-xs text-slate-400 mt-2 italic border-t border-teal-100 pt-2">
                      💡 {testResult.reasoning}
                    </p>
                  )}
                  {testResult.disclaimer && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                      ℹ️ {testResult.disclaimer}
                    </p>
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
