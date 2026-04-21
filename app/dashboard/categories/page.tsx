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

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

const NICHES = [
  { value: "long_clothing", label: "👗 ملابس طويلة (عبايات، جلابيب)" },
  { value: "kids",          label: "👶 ملابس أطفال"                  },
  { value: "sports",        label: "🏃 ملابس رياضية"                 },
  { value: "other",         label: "📦 أخرى"                        },
];

// Industry-standard template for long clothing
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
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [toast,      setToast]      = useState("");
  const [saving,     setSaving]     = useState(false);

  // Form fields
  const [catName,  setCatName]  = useState("");
  const [catTag,   setCatTag]   = useState("");
  const [catNiche, setCatNiche] = useState("long_clothing");
  const [cols,     setCols]     = useState<ChartColumn[]>(DEFAULT_COLS);
  const [rows,     setRows]     = useState<ChartRow[]>(DEFAULT_ROWS);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }

    let { data: merchant } = await supabase.from("merchants").select("id").eq("user_id", user.id).single();
    if (!merchant) {
      const { data: m } = await supabase.from("merchants").insert({ user_id: user.id, store_name: "متجري" }).select("id").single();
      merchant = m;
    }
    if (merchant) { setMerchantId(merchant.id); fetchCategories(merchant.id); }
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
    setCatName(cat.name); setCatTag(cat.tag || ""); setCatNiche(cat.niche || "long_clothing");
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
    setSaving(true);
    const payload = {
      merchant_id: merchantId,
      name:        catName.trim(),
      tag:         catTag.trim().toLowerCase().replace(/\s+/g, "-"),
      niche:       catNiche,
      size_chart:  chartToJson(cols, rows),
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

  // ── Chart handlers ─────────────────────────────────────────────────────────

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
    setRows(r => [...r, { size: "جديد", cells: emptyCells }]);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">الفئات</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">فئات المنتجات</h1>
        <p className="text-slate-400 text-sm mt-1">أنشئ فئة لكل مجموعة منتجات تشترك في نفس جدول المقاسات</p>
      </div>

      {toast && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm px-5 py-3 rounded-xl">
          {toast}
        </div>
      )}

      {!showForm && (
        <div className="flex justify-end mb-6">
          <button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition">
            + فئة جديدة
          </button>
        </div>
      )}

      {/* ── FORM ── */}
      {showForm && (
        <div id="form-top" className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-lg">{editingCat ? `تعديل: ${editingCat.name}` : "فئة جديدة"}</h2>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">✕</button>
          </div>

          <div className="p-6 space-y-6">

            {/* Template banner — new categories only */}
            {!editingCat && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-5 py-4">
                <p className="text-sm font-black text-teal-800 mb-0.5">📋 جدول افتراضي جاهز</p>
                <p className="text-xs text-teal-700 leading-relaxed">
                  تم تعبئة الجدول تلقائياً بمعايير عالمية للملابس الطويلة (عبايات، جلابيب).
                  يمكنك تعديل أي قيمة أو إضافة / حذف أعمدة وصفوف.
                </p>
              </div>
            )}

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">اسم الفئة</label>
                <input
                  type="text" placeholder="مثال: عبايات حرير فاخرة"
                  value={catName} onChange={e => setCatName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">نوع النيش</label>
                <select
                  value={catNiche} onChange={e => setCatNiche(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 bg-white transition"
                >
                  {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
            </div>

            {/* Tag field with tip */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">الـ Tag</label>
              <input
                type="text" placeholder="مثال: silk-abayas" dir="ltr"
                value={catTag} onChange={e => setCatTag(e.target.value.replace(/\s/g, "-").toLowerCase())}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
              />
              {/* Tag tip */}
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-black text-amber-800 mb-1">💡 نصيحة مهمة حول الـ Tag</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>لا تستخدم اسم المنتج</strong> كـ Tag. استخدم اسم الفئة ليشمل كل المنتجات التي تشترك في نفس جدول المقاسات.<br/>
                  مثال صحيح: <code className="bg-amber-100 px-1 rounded font-mono">silk-abayas</code> — يُضاف لجميع العبايات الحريرية.<br/>
                  مثال خاطئ: <code className="bg-amber-100 px-1 rounded font-mono">عباية-زرقاء-2024</code> — خاص بمنتج واحد فقط.
                </p>
              </div>
            </div>

            {/* Size chart builder */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-black text-slate-900 text-sm">📊 جدول المقاسات</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    الأعمدة المحددة بـ "🔗 يطابق..." تُستخدم في حساب المقاس — الباقي للعرض فقط
                  </p>
                </div>
                <button
                  onClick={addColumn}
                  className="text-teal-600 hover:text-teal-800 text-xs font-bold border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition"
                >
                  + عمود
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-right px-3 py-2.5 text-xs font-bold text-slate-500 w-32 border-b border-slate-200">
                        المقاس
                      </th>
                      {cols.map(col => (
                        <th key={col.id} className="px-2 py-2 min-w-[170px] border-b border-slate-200">
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
                                className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-teal-400 bg-white"
                              >
                                <option value="">📋 للعرض فقط</option>
                                <option value="height">🔗 يطابق الطول</option>
                                <option value="weight">🔗 يطابق الوزن</option>
                              </select>
                              <button
                                onClick={() => removeColumn(col.id)}
                                className="text-slate-300 hover:text-red-500 font-bold text-base leading-none transition"
                              >✕</button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={row.size}
                              onChange={e => updateRowSize(ri, e.target.value)}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-black text-teal-700 focus:outline-none focus:border-teal-400 w-[90px]"
                            >
                              {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                              <option value={row.size}>{row.size}</option>
                            </select>
                            <button onClick={() => removeRow(ri)} className="text-slate-200 hover:text-red-400 transition">🗑</button>
                          </div>
                        </td>
                        {cols.map(col => (
                          <td key={col.id} className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number" placeholder="من"
                                value={row.cells[col.id]?.min ?? ""}
                                onChange={e => updateCell(ri, col.id, "min", e.target.value)}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-teal-400"
                              />
                              <span className="text-slate-300 text-xs">—</span>
                              <input
                                type="number" placeholder="إلى"
                                value={row.cells[col.id]?.max ?? ""}
                                onChange={e => updateCell(ri, col.id, "max", e.target.value)}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-teal-400"
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

            {/* JSON preview */}
            <details className="bg-slate-50 border border-slate-200 rounded-xl">
              <summary className="px-4 py-3 text-xs font-bold text-slate-500 cursor-pointer select-none">
                معاينة JSON (للمطورين)
              </summary>
              <pre className="px-4 pb-4 text-xs text-slate-600 font-mono overflow-x-auto" dir="ltr">
                {JSON.stringify(chartToJson(cols, rows), null, 2)}
              </pre>
            </details>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleSave} disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-black text-sm transition"
              >
                {saving ? "جاري الحفظ..." : editingCat ? "حفظ التعديلات" : "حفظ الفئة"}
              </button>
              <button onClick={cancelForm} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category List ── */}
      <div className="space-y-3">
        {categories.length === 0 && !showForm && (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📐</p>
            <p className="text-slate-500 font-bold mb-1">لا توجد فئات بعد</p>
            <p className="text-slate-400 text-sm mb-5">أنشئ فئة لكل مجموعة منتجات تشترك في نفس جدول المقاسات</p>
            <button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition">
              + أضف فئتك الأولى
            </button>
          </div>
        )}

        {categories.map(cat => {
          const { cols: c } = jsonToChart(cat.size_chart);
          const matchCols = c.filter(col => col.quiz_field).length;
          const niche = NICHES.find(n => n.value === cat.niche);
          return (
            <div key={cat.id} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-black text-slate-900">{cat.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {cat.tag && (
                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                      #{cat.tag}
                    </span>
                  )}
                  {niche && (
                    <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 rounded-full">
                      {niche.label}
                    </span>
                  )}
                  {matchCols > 0 && (
                    <span className="text-slate-400 text-xs">📊 {matchCols} عمود حساب</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openEdit(cat)}
                  className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-slate-300 hover:text-red-500 text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* How to use tags */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="font-black text-slate-800 text-sm mb-3">🔗 كيف يعمل الـ Widget تلقائياً؟</h3>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>1.</strong> الـ Widget يقرأ عنوان المنتج من صفحتك تلقائياً.
          </p>
          <p>
            <strong>2.</strong> يقارنه مع الـ Tags المحفوظة — إذا وجد تطابقاً، يحمّل جدول المقاسات الصحيح.
          </p>
          <p>
            <strong>3.</strong> لا تحتاج لتعديل أي كود في متجرك — فقط أضف كود التضمين مرة واحدة في الـ Header.
          </p>
        </div>
        <pre className="mt-3 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 overflow-x-auto" dir="ltr">
          {`<meta name="product-tag" content="TAG">  <!-- اختياري: للتحكم اليدوي -->`}
        </pre>
      </div>
    </div>
  );
}
