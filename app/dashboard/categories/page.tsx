"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  FITTED_DEFAULT_CHART,
  TSHIRT_DEFAULT_CHART,
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
  size:      string;
  bust_min:  string;
  bust_max:  string;
  waist_min: string;
  waist_max: string;
  hip_min:   string;
  hip_max:   string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NICHES = [
  { value: "tshirt", label: "👕 تيشيرت (رجالي)"             },
  { value: "fitted", label: "👗 كسوة ضيقة (نسائي)"          },
  { value: "abaya",  label: "👗 عباية / لباس طويل (نسائي)"  },
  { value: "thobe",  label: "👘 ثوب / جلابة (رجالي)"        },
];

const NICHE_HINTS: Record<string, string> = {
  tshirt: "يُحسب المقاس بالطول والوزن + شكل الكتف والخصر",
  fitted: "يُحسب المقاس بالـ BMI + شكل الصدر والخصر والورك",
  abaya:  "يُحسب المقاس بالـ BMI + شكل الصدر والورك (الخصر لا يؤثر)",
  thobe:  "يُحسب المقاس بالـ BMI + شكل الكتف والصدر (الخصر والورك لا يؤثران)",
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
    size:      r.size,
    bust_min:  String(r.bust_min  ?? ""),
    bust_max:  String(r.bust_max),
    waist_min: String(r.waist_min ?? ""),
    waist_max: String(r.waist_max),
    hip_min:   String(r.hip_min   ?? ""),
    hip_max:   String(r.hip_max),
  }));
}

function editRowsToChart(rows: EditRow[]): SizeChart {
  return {
    rows: rows.map(r => ({
      size:      r.size,
      bust_min:  parseFloat(r.bust_min)  || 0,
      bust_max:  parseFloat(r.bust_max)  || 0,
      waist_min: parseFloat(r.waist_min) || 0,
      waist_max: parseFloat(r.waist_max) || 0,
      hip_min:   parseFloat(r.hip_min)   || 0,
      hip_max:   parseFloat(r.hip_max)   || 0,
    })),
  };
}

function defaultEditRows(niche: string): EditRow[] {
  const chart = (niche === "tshirt" || niche === "t_shirt" || niche === "thobe")
    ? TSHIRT_DEFAULT_CHART
    : FITTED_DEFAULT_CHART;
  return chartToEditRows(chart);
}

function emptyRow(): EditRow {
  return { size: "S", bust_min: "", bust_max: "", waist_min: "", waist_max: "", hip_min: "", hip_max: "" };
}

function jsonToEditRows(json: unknown, niche: string): EditRow[] {
  const j = json as { rows?: Record<string, unknown>[] } | null;
  if (!j?.rows?.length) return defaultEditRows(niche);
  if ("bust_max" in (j.rows[0] as object)) {
    return j.rows.map(r => ({
      size:      String(r.size      ?? ""),
      bust_min:  String(r.bust_min  ?? ""),
      bust_max:  String(r.bust_max  ?? ""),
      waist_min: String(r.waist_min ?? ""),
      waist_max: String(r.waist_max ?? ""),
      hip_min:   String(r.hip_min   ?? ""),
      hip_max:   String(r.hip_max   ?? ""),
    }));
  }
  return defaultEditRows(niche);
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
  const [catNiche,  setCatNiche]  = useState<string>("fitted");
  const [catFabric, setCatFabric] = useState<string>("semi");
  const [rows,      setRows]      = useState<EditRow[]>(() => defaultEditRows("fitted"));

  // Test modal
  const [testCat,       setTestCat]       = useState<Category | null>(null);
  const [testHeight, setTestHeight] = useState("165");
  const [testWeight, setTestWeight] = useState("70");
  const [testKatif,  setTestKatif]  = useState("normal");
  const [testSadr,   setTestSadr]   = useState("normal");
  const [testKhasr,  setTestKhasr]  = useState("normal");
  const [testWarek,  setTestWarek]  = useState("normal");
  const [testResult, setTestResult] = useState<{
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
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, tag, niche, fabric_type, size_chart")
        .eq("merchant_id", mid)
        .order("created_at");
      if (error) throw error;
      if (data) setCategories(data as Category[]);
    } catch {
      showToast("❌ خطأ في تحميل الفئات");
    }
  }

  function openNew() {
    setEditingCat(null);
    setCatName(""); setCatTag(""); setCatNiche("fitted"); setCatFabric("semi");
    setRows(defaultEditRows("fitted"));
    setShowForm(true);
    setTimeout(() => document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatTag(cat.tag || "");
    const niche = (["fitted","tshirt","abaya","thobe","long_clothing","dress","t_shirt"].includes(cat.niche)) ? cat.niche : "fitted";
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
    if (!catName.trim()) { showToast("❌ أدخل اسم الفئة"); return; }
    if (!catTag.trim())  { showToast("❌ أدخل الـ Tag"); return; }
    if (!merchantId) { showToast("❌ لم تتحمل بيانات المتجر — أعد تحميل الصفحة"); return; }
    const sizes = rows.map(r => r.size);
    if (new Set(sizes).size !== sizes.length) {
      showToast("❌ يوجد مقاسات مكررة — تأكد من أن كل صف له مقاس مختلف");
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
        size_chart:  editRowsToChart(rows),
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
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { showToast("❌ خطأ في الحذف — حاول مرة أخرى"); return; }
    if (merchantId) fetchCategories(merchantId);
  }

  async function handleTest() {
    if (!testCat) return;
    setTesting(true); setTestResult(null); setTestError("");
    try {
      const res = await fetch("/api/merchant/test-size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag:    testCat.tag,
          height: Number(testHeight),
          weight: Number(testWeight),
          katif:  testKatif,
          sadr:   testSadr,
          khasr:  testKhasr,
          warek:  testWarek,
        }),
      });
      const data = await res.json();
      if (!res.ok) setTestError(data.error || "حدث خطأ");
      else         setTestResult(data);
    } catch {
      setTestError("❌ خطأ في الاتصال — حاول مرة أخرى");
    } finally {
      setTesting(false);
    }
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
              const isOld = j?.rows?.length && !("bust_max" in (j.rows[0] as object));
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
                <table className="w-full text-xs border-collapse" style={{ minWidth: 520 }}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-right px-3 py-2 font-black text-slate-700 w-16" rowSpan={2}>المقاس</th>
                      <th colSpan={2} className="text-center px-2 py-1.5 font-bold text-blue-700 bg-blue-50 border-r border-l border-blue-100">
                        الصدر (سم)
                      </th>
                      <th colSpan={2} className="text-center px-2 py-1.5 font-bold text-indigo-700 bg-indigo-50 border-r border-indigo-100">
                        الخصر (سم)
                      </th>
                      <th colSpan={2} className="text-center px-2 py-1.5 font-bold text-purple-700 bg-purple-50">
                        الورك (سم)
                      </th>
                      <th className="w-8 bg-slate-50" rowSpan={2} />
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-center px-1 py-1 font-semibold text-slate-400 bg-blue-50 border-r border-l border-blue-100 text-[10px]">من</th>
                      <th className="text-center px-1 py-1 font-semibold text-slate-400 bg-blue-50 border-r border-blue-100 text-[10px]">إلى</th>
                      <th className="text-center px-1 py-1 font-semibold text-slate-400 bg-indigo-50 border-r border-indigo-100 text-[10px]">من</th>
                      <th className="text-center px-1 py-1 font-semibold text-slate-400 bg-indigo-50 border-r border-indigo-100 text-[10px]">إلى</th>
                      <th className="text-center px-1 py-1 font-semibold text-slate-400 bg-purple-50 border-r border-purple-100 text-[10px]">من</th>
                      <th className="text-center px-1 py-1 font-semibold text-slate-400 bg-purple-50 text-[10px]">إلى</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-2 py-2">
                          <select
                            value={row.size}
                            onChange={e => updateRow(ri, "size", e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-teal-700 focus:outline-none focus:border-teal-400 bg-white w-full"
                          >
                            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        {/* Bust min/max */}
                        <td className="px-1 py-2 border-r border-l border-blue-50">
                          <input type="number" value={row.bust_min}
                            onChange={e => updateRow(ri, "bust_min", e.target.value)}
                            placeholder="0"
                            className="w-14 border border-blue-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400 bg-blue-50/30"
                          />
                        </td>
                        <td className="px-1 py-2 border-r border-blue-50">
                          <input type="number" value={row.bust_max}
                            onChange={e => updateRow(ri, "bust_max", e.target.value)}
                            placeholder="94"
                            className="w-14 border border-blue-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400 bg-blue-50/30"
                          />
                        </td>
                        {/* Waist min/max */}
                        <td className="px-1 py-2 border-r border-indigo-50">
                          <input type="number" value={row.waist_min}
                            onChange={e => updateRow(ri, "waist_min", e.target.value)}
                            placeholder="0"
                            className="w-14 border border-indigo-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-indigo-400 bg-indigo-50/30"
                          />
                        </td>
                        <td className="px-1 py-2 border-r border-indigo-50">
                          <input type="number" value={row.waist_max}
                            onChange={e => updateRow(ri, "waist_max", e.target.value)}
                            placeholder="77.5"
                            className="w-14 border border-indigo-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-indigo-400 bg-indigo-50/30"
                          />
                        </td>
                        {/* Hip min/max */}
                        <td className="px-1 py-2 border-r border-purple-50">
                          <input type="number" value={row.hip_min}
                            onChange={e => updateRow(ri, "hip_min", e.target.value)}
                            placeholder="0"
                            className="w-14 border border-purple-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-purple-400 bg-purple-50/30"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input type="number" value={row.hip_max}
                            onChange={e => updateRow(ri, "hip_max", e.target.value)}
                            placeholder="92.7"
                            className="w-14 border border-purple-100 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:border-purple-400 bg-purple-50/30"
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

              {/* Katif */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">الكتف (katif)</label>
                <div className="flex gap-2">
                  {[{v:"wide",l:"عريض"},{v:"normal",l:"عادي"},{v:"slim",l:"رقيق"}].map(s => (
                    <button key={s.v} type="button" onClick={() => setTestKatif(s.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${testKatif === s.v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500"}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sadr */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">الصدر (sadr)</label>
                <div className="flex gap-2">
                  {[{v:"big",l:"كبير"},{v:"normal",l:"عادي"},{v:"slim",l:"رقيق"}].map(s => (
                    <button key={s.v} type="button" onClick={() => setTestSadr(s.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${testSadr === s.v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500"}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khasr */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">الخصر (khasr)</label>
                <div className="flex gap-2">
                  {[{v:"big",l:"كبير"},{v:"normal",l:"عادي"},{v:"slim",l:"رقيق"}].map(s => (
                    <button key={s.v} type="button" onClick={() => setTestKhasr(s.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${testKhasr === s.v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500"}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warek */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">الورك (warek)</label>
                <div className="flex gap-2">
                  {[{v:"big",l:"كبير"},{v:"normal",l:"عادي"},{v:"slim",l:"رقيق"}].map(s => (
                    <button key={s.v} type="button" onClick={() => setTestWarek(s.v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${testWarek === s.v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500"}`}>
                      {s.l}
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
