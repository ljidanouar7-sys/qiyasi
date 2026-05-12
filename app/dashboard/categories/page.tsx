"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  ABAYA_DEFAULT_CHART,
  T_SHIRT_DEFAULT_CHART,
  type SizeRow,
  type SizeChart,
} from "../../../lib/globalSizeCharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id:          string;
  name:        string;
  tag:         string;
  niche:       string;
  fabric_type: string;
  size_chart:  unknown;
}

interface EditRow {
  size:       string;
  height_min: string;
  height_max: string;
  weight_min: string;
  weight_max: string;
  chest:      string;
  hips:       string;
  shoulder:   string;
  length:     string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NICHES = [
  { value: "long_clothing", label: "👗 ملابس طويلة (عبايات / جلابيب)" },
  { value: "dress",         label: "👗 فستان"                           },
  { value: "t_shirt",       label: "👕 تيشيرت / قميص"                  },
];

const NICHE_HINTS: Record<string, string> = {
  long_clothing: "يُحسب المقاس بالطول والوزن — يُختار الأكبر بين المؤشرين",
  dress:         "يُحسب المقاس بالطول والوزن — يُختار الأكبر بين المؤشرين",
  t_shirt:       "يُحسب المقاس بالوزن أساساً — يُعدَّل بشكل الكتف والطول",
};

const FABRICS = [
  { value: "stretch", label: "مطاطي"            },
  { value: "semi",    label: "شبه مطاطي"        },
  { value: "rigid",   label: "صلب (غير مطاطي)"  },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function chartToEditRows(chart: SizeChart): EditRow[] {
  return chart.rows.map(r => ({
    size:       r.size,
    height_min: String(r.height_min),
    height_max: String(r.height_max),
    weight_min: String(r.weight_min),
    weight_max: String(r.weight_max),
    chest:      String(r.chest),
    hips:       String(r.hips     ?? ""),
    shoulder:   String(r.shoulder ?? ""),
    length:     String(r.length),
  }));
}

function defaultEditRows(niche: string): EditRow[] {
  const chart = niche === "t_shirt" ? T_SHIRT_DEFAULT_CHART : ABAYA_DEFAULT_CHART;
  return chartToEditRows(chart);
}

function jsonToEditRows(json: unknown, niche: string): EditRow[] {
  const j = json as { rows?: Record<string, unknown>[] } | null;
  if (!j?.rows?.length) return defaultEditRows(niche);
  if ("height_min" in (j.rows[0] as object)) {
    return j.rows.map(r => ({
      size:       String(r.size       ?? ""),
      height_min: String(r.height_min ?? ""),
      height_max: String(r.height_max ?? ""),
      weight_min: String(r.weight_min ?? ""),
      weight_max: String(r.weight_max ?? ""),
      chest:      String(r.chest      ?? ""),
      hips:       String(r.hips       ?? ""),
      shoulder:   String(r.shoulder   ?? ""),
      length:     String(r.length     ?? ""),
    }));
  }
  return defaultEditRows(niche);
}

function editRowsToChart(rows: EditRow[], niche: string): SizeChart {
  const showHips = niche !== "t_shirt";
  return {
    rows: rows.map(r => {
      const row: SizeRow = {
        size:       r.size,
        height_min: Number(r.height_min) || 0,
        height_max: Number(r.height_max) || 0,
        weight_min: Number(r.weight_min) || 0,
        weight_max: Number(r.weight_max) || 0,
        chest:      Number(r.chest)      || 0,
        length:     Number(r.length)     || 0,
      };
      if (showHips  && r.hips)     row.hips     = Number(r.hips)     || 0;
      if (!showHips && r.shoulder) row.shoulder = Number(r.shoulder) || 0;
      return row;
    }),
  };
}

function emptyRow(): EditRow {
  return {
    size: "S", height_min: "", height_max: "",
    weight_min: "", weight_max: "",
    chest: "", hips: "", shoulder: "", length: "",
  };
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

  const [catName,   setCatName]   = useState("");
  const [catTag,    setCatTag]    = useState("");
  const [catNiche,  setCatNiche]  = useState<string>("long_clothing");
  const [catFabric, setCatFabric] = useState<string>("semi");
  const [rows,      setRows]      = useState<EditRow[]>(() => defaultEditRows("long_clothing"));

  // Test modal
  const [testCat,       setTestCat]       = useState<Category | null>(null);
  const [testHeight,    setTestHeight]    = useState("165");
  const [testWeight,    setTestWeight]    = useState("70");
  const [testShoulders, setTestShoulders] = useState("normal");
  const [testBelly,     setTestBelly]     = useState("average");
  const [testPref,      setTestPref]      = useState("regular");
  const [testResult,    setTestResult]    = useState<{
    size: string; status: string; alternatives: string[];
  } | null>(null);
  const [testError, setTestError] = useState("");
  const [testing,   setTesting]   = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    let { data: merchant } = await supabase
      .from("merchants").select("id, plan").eq("user_id", user.id).single();
    if (!merchant) {
      const { data: m } = await supabase
        .from("merchants").insert({ user_id: user.id, store_name: "متجري" }).select("id, plan").single();
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
      .select("id, name, tag, niche, fabric_type, size_chart")
      .eq("merchant_id", mid)
      .order("created_at");
    if (data) setCategories(data as Category[]);
  }

  function openNew() {
    setEditingCat(null);
    setCatName(""); setCatTag(""); setCatNiche("long_clothing"); setCatFabric("semi");
    setRows(defaultEditRows("long_clothing"));
    setShowForm(true);
    setTimeout(() => document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatTag(cat.tag || "");
    const niche = (["long_clothing", "dress", "t_shirt"].includes(cat.niche)) ? cat.niche : "long_clothing";
    setCatNiche(niche);
    setCatFabric(cat.fabric_type || "semi");
    setRows(jsonToEditRows(cat.size_chart, niche));
    setShowForm(true);
    setTimeout(() => document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function cancelForm() { setShowForm(false); setEditingCat(null); }

  function handleNicheChange(newNiche: string) {
    setCatNiche(newNiche);
    if (!editingCat) setRows(defaultEditRows(newNiche));
  }

  function updateRow(ri: number, field: keyof EditRow, value: string) {
    setRows(r => r.map((row, i) => i === ri ? { ...row, [field]: value } : row));
  }

  function addRow() { setRows(r => [...r, emptyRow()]); }
  function removeRow(i: number) { setRows(r => r.filter((_, j) => j !== i)); }

  async function handleSave() {
    if (!catName.trim()) { alert("أدخل اسم الفئة"); return; }
    if (!catTag.trim())  { alert("أدخل الـ Tag"); return; }
    if (!merchantId) { showToast("❌ لم تتحمل بيانات المتجر — أعد تحميل الصفحة"); return; }
    const sizes = rows.map(r => r.size);
    if (new Set(sizes).size !== sizes.length) {
      alert("يوجد مقاسات مكررة — تأكد من أن كل صف له مقاس مختلف");
      return;
    }
    if (!editingCat) {
      const MAX = merchantPlan === "pro" ? 50 : 3;
      if (categories.length >= MAX) { showToast(`❌ وصلت للحد الأقصى (${MAX} فئات)`); return; }
    }
    setSaving(true);
    try {
      const payload = {
        merchant_id: merchantId,
        name:        catName.trim(),
        tag:         catTag.trim().replace(/\s+/g, "-"),
        niche:       catNiche,
        fabric_type: catFabric,
        size_chart:  editRowsToChart(rows, catNiche),
      };
      const { error } = editingCat
        ? await supabase.from("categories").update(payload).eq("id", editingCat.id)
        : await supabase.from("categories").insert(payload);
      if (error) { showToast(`❌ خطأ في الحفظ: ${error.message}`); return; }
      showToast(editingCat ? "✅ تم التعديل" : "✅ تم الحفظ");
      setShowForm(false);
      fetchCategories(merchantId);
    } catch {
      showToast("❌ خطأ في الاتصال — تحقق من الإنترنت");
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
        tag:        testCat.tag,
        height:     Number(testHeight),
        weight:     Number(testWeight),
        shoulders:  testShoulders,
        belly:      testBelly,
        preference: testPref,
      }),
    });
    const data = await res.json();
    if (!res.ok) setTestError(data.error || "حدث خطأ");
    else         setTestResult(data);
    setTesting(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), msg.startsWith("❌") ? 6000 : 3000);
  }

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm font-bold">جاري التحميل...</p>
      </div>
    );
  }

  const showHips = catNiche !== "t_shirt";

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">الفئات</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">فئات المنتجات</h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">أنشئ فئة لكل مجموعة منتجات تشترك في نفس جدول المقاسات</p>
      </div>

      {!showForm && (
        <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-xl mb-6">
          <h3 className="text-base font-black text-blue-800 mb-2">🔗 كيف تربط منتجاتك بجدول المقاسات؟</h3>
          <p className="text-sm text-slate-700 mb-2">
            كل فئة لها <strong>رمز خاص</strong> — ضعه على منتجاتك وتعرف الأداة أي جدول تستخدم.
          </p>
          <div className="bg-white p-3 rounded-xl border border-blue-100">
            <p className="text-xs text-slate-600">مثال: 20 عباية حريرية → رمز <code className="bg-slate-100 px-1 rounded font-mono">silk-abayas</code> على كلها → جدول مقاسات واحد.</p>
          </div>
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
                <p className="text-sm font-black text-teal-800 mb-0.5">📋 قالب تلقائي جاهز</p>
                <p className="text-xs text-teal-700">تم تعبئة الجدول بمعايير دولية — عدّل القيم حسب منتجاتك.</p>
              </div>
            )}

            {editingCat && (() => {
              const j = editingCat.size_chart as { rows?: Record<string, unknown>[] } | null;
              const isOld = j?.rows?.length && !("height_min" in (j.rows[0] as object));
              return isOld ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-sm font-black text-amber-800 mb-0.5">⚠️ تنسيق قديم — أعد إدخال القياسات</p>
                  <p className="text-xs text-amber-700">تغيّر نظام المقاسات — يرجى إعادة إدخال قيم الطول والوزن.</p>
                </div>
              ) : null;
            })()}

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
                <p className="text-xs text-teal-700 mt-1.5 bg-teal-50 px-3 py-1.5 rounded-lg">
                  ⚙️ {NICHE_HINTS[catNiche]}
                </p>
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

            {/* Fabric Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">نوع القماش</label>
              <div className="flex gap-3 flex-wrap">
                {FABRICS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setCatFabric(f.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
                      catFabric === f.value
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-teal-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Size Chart Table ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-slate-900 text-sm">📊 جدول المقاسات</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs border-collapse" style={{ minWidth: 580 }}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th rowSpan={2} className="text-right px-3 py-2.5 font-black text-slate-700 w-20 border-b border-slate-200">المقاس</th>
                      <th colSpan={2} className="text-center px-3 py-2 font-bold text-teal-700 border-r border-l border-teal-100 bg-teal-50/50">
                        الطول (سم)
                      </th>
                      <th colSpan={2} className="text-center px-3 py-2 font-bold text-teal-700 border-r border-teal-100 bg-teal-50/50">
                        الوزن (كغ)
                      </th>
                      <th rowSpan={2} className="text-center px-3 py-2.5 font-bold text-blue-700 bg-blue-50/50 border-r border-l border-blue-100 border-b border-slate-200">
                        صدر (سم)
                      </th>
                      <th rowSpan={2} className="text-center px-3 py-2.5 font-bold text-blue-700 bg-blue-50/50 border-r border-blue-100 border-b border-slate-200">
                        {showHips ? "ورك (سم)" : "كتف (سم)"}
                      </th>
                      <th rowSpan={2} className="text-center px-3 py-2.5 font-bold text-blue-700 bg-blue-50/50 border-b border-slate-200">
                        طول الثوب (سم)
                      </th>
                      <th rowSpan={2} className="w-8 bg-slate-50 border-b border-slate-200" />
                    </tr>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400">
                      <th className="text-center px-2 py-1 font-normal border-r border-l border-teal-50">من</th>
                      <th className="text-center px-2 py-1 font-normal border-r border-teal-50">إلى</th>
                      <th className="text-center px-2 py-1 font-normal border-r border-teal-50">من</th>
                      <th className="text-center px-2 py-1 font-normal border-r border-teal-50">إلى</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-3 py-2">
                          <select
                            value={row.size}
                            onChange={e => updateRow(ri, "size", e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-teal-700 focus:outline-none focus:border-teal-400 bg-white w-full"
                          >
                            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        {(["height_min","height_max","weight_min","weight_max"] as (keyof EditRow)[]).map((field, fi) => (
                          <td key={field} className={`px-1 py-2 ${fi % 2 === 0 ? "border-r border-l border-teal-50" : "border-r border-teal-50"}`}>
                            <input
                              type="number" value={row[field]}
                              onChange={e => updateRow(ri, field, e.target.value)}
                              placeholder={field.includes("height") ? (fi % 2 === 0 ? "155" : "163") : (fi % 2 === 0 ? "55" : "67")}
                              className="w-14 border border-slate-200 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-teal-400 bg-white"
                            />
                          </td>
                        ))}
                        <td className="px-1 py-2 border-r border-l border-blue-50">
                          <input
                            type="number" value={row.chest}
                            onChange={e => updateRow(ri, "chest", e.target.value)}
                            placeholder="49"
                            className="w-14 border border-blue-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400 bg-blue-50/30"
                          />
                        </td>
                        <td className="px-1 py-2 border-r border-blue-50">
                          <input
                            type="number"
                            value={showHips ? row.hips : row.shoulder}
                            onChange={e => updateRow(ri, showHips ? "hips" : "shoulder", e.target.value)}
                            placeholder={showHips ? "53" : "46"}
                            className="w-14 border border-blue-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400 bg-blue-50/30"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input
                            type="number" value={row.length}
                            onChange={e => updateRow(ri, "length", e.target.value)}
                            placeholder="150"
                            className="w-14 border border-blue-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400 bg-blue-50/30"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeRow(ri)}
                            className="text-slate-300 hover:text-red-400 text-base leading-none transition">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={addRow}
                className="mt-3 w-full border-2 border-dashed border-teal-200 hover:border-teal-400 text-teal-600 font-bold text-sm py-3 rounded-xl transition">
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
          <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📐</p>
            <p className="text-slate-500 font-bold mb-1">لا توجد فئات بعد</p>
            <p className="text-slate-400 text-sm mb-5">أنشئ فئة لكل مجموعة منتجات تشترك في نفس جدول المقاسات</p>
            <button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition">
              + أضف فئتك الأولى
            </button>
          </div>
        )}

        {categories.map(cat => {
          const j       = cat.size_chart as { rows?: unknown[] } | null;
          const hasRows = (j?.rows ?? []).length > 0;
          const hasTag  = !!cat.tag?.trim();
          const isReady = hasTag && hasRows;
          const niche   = NICHES.find(n => n.value === cat.niche);
          const fabric  = FABRICS.find(f => f.value === cat.fabric_type);
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
                    {niche  && <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 rounded-full">{niche.label}</span>}
                    {fabric && <span className="bg-purple-50 text-purple-600 text-xs px-2.5 py-0.5 rounded-full">{fabric.label}</span>}
                    {hasRows
                      ? <span className="text-slate-400 text-xs">📊 {(j?.rows ?? []).length} مقاسات</span>
                      : <span className="text-amber-500 text-xs font-semibold">⚠️ لا يوجد جدول</span>
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

              {/* Height + Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الطول (سم)</label>
                  <input type="number" value={testHeight} onChange={e => setTestHeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الوزن (كغ)</label>
                  <input type="number" value={testWeight} onChange={e => setTestWeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                </div>
              </div>

              {/* Shoulders */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">شكل الكتف</label>
                <div className="flex gap-2">
                  {[{v:"narrow",l:"ضيقة"},{v:"normal",l:"عادية"},{v:"broad",l:"عريضة"}].map(s => (
                    <button key={s.v} type="button" onClick={() => setTestShoulders(s.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${testShoulders === s.v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500"}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Belly */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">شكل البطن</label>
                <div className="flex gap-2">
                  {[{v:"flat",l:"مسطح"},{v:"average",l:"متوسط"},{v:"large",l:"كبير"}].map(b => (
                    <button key={b.v} type="button" onClick={() => setTestBelly(b.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${testBelly === b.v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500"}`}>
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">تفضيل المقاس</label>
                <div className="flex gap-2">
                  {[{v:"slim",l:"ضيق"},{v:"regular",l:"عادي"},{v:"loose",l:"واسع"}].map(p => (
                    <button key={p.v} type="button" onClick={() => setTestPref(p.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${testPref === p.v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500"}`}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>

              {testResult && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-4 text-center">
                  <p className="text-xs text-teal-600 font-bold mb-1">المقاس الموصى به</p>
                  <p className="text-4xl font-black text-teal-700 mb-2">{testResult.size}</p>
                  {testResult.alternatives.length > 0 && (
                    <p className="text-xs text-slate-400">
                      بدائل: <span className="font-bold text-slate-600">{testResult.alternatives.join(" · ")}</span>
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
