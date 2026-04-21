"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

type ConditionOp = "min" | "max" | "eq";
type FieldKey    = "height" | "weight" | "shoulders" | "legs" | "belly";

interface Condition {
  field: FieldKey;
  op:    ConditionOp;
  value: string;
}

interface Rule {
  size:       string;
  conditions: Condition[];
}

interface Category {
  id:         string;
  name:       string;
  tag:        string;
  size_rules: unknown;
}

// ── Field metadata ────────────────────────────────────────────────────────────

const FIELDS: Record<FieldKey, { label: string; type: "number" | "select"; unit?: string; options?: { v: string; label: string }[] }> = {
  height:    { label: "الطول",        type: "number", unit: "سم" },
  weight:    { label: "الوزن",        type: "number", unit: "كغ" },
  shoulders: { label: "شكل الكتف",   type: "select", options: [{ v: "wide", label: "عريض" }, { v: "average", label: "متوسط" }, { v: "narrow", label: "ضيق" }] },
  legs:      { label: "طول الرجلين", type: "select", options: [{ v: "long", label: "طويل" }, { v: "average", label: "متوسط" }, { v: "short", label: "قصير" }] },
  belly:     { label: "شكل البطن",   type: "select", options: [{ v: "flat", label: "مسطحة" }, { v: "average", label: "متوسطة" }, { v: "big", label: "كبيرة" }] },
};

const FIELD_KEYS = Object.keys(FIELDS) as FieldKey[];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// ── Converters between UI state ↔ JSONB ────────────────────────────────────

function rulesToJson(rules: Rule[], defaultSize: string) {
  return {
    default: defaultSize,
    rules: rules.map(r => ({
      size: r.size,
      conditions: r.conditions.reduce((acc, c) => {
        if (!acc[c.field]) acc[c.field] = {};
        if (c.op === "min") (acc[c.field] as Record<string,unknown>).min = +c.value;
        else if (c.op === "max") (acc[c.field] as Record<string,unknown>).max = +c.value;
        else if (c.op === "eq") (acc[c.field] as Record<string,unknown>).eq  = c.value;
        return acc;
      }, {} as Record<string, Record<string, unknown>>),
    })),
  };
}

function jsonToRules(json: unknown): { rules: Rule[]; defaultSize: string } {
  const j = json as Record<string, unknown> | null;
  if (!j || !Array.isArray(j.rules)) return { rules: [], defaultSize: "M" };
  const rules: Rule[] = (j.rules as Record<string, unknown>[]).map(r => ({
    size: r.size as string,
    conditions: Object.entries(r.conditions as Record<string, Record<string, unknown>> || {}).flatMap(
      ([field, cond]) => {
        const cs: Condition[] = [];
        if (cond.min !== undefined) cs.push({ field: field as FieldKey, op: "min", value: String(cond.min) });
        if (cond.max !== undefined) cs.push({ field: field as FieldKey, op: "max", value: String(cond.max) });
        if (cond.eq  !== undefined) cs.push({ field: field as FieldKey, op: "eq",  value: String(cond.eq)  });
        return cs;
      }
    ),
  }));
  return { rules, defaultSize: (j.default as string) || "M" };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [merchantId,   setMerchantId]   = useState<string | null>(null);
  const [editingCat,   setEditingCat]   = useState<Category | null>(null);

  // form state
  const [catName,      setCatName]      = useState("");
  const [catTag,       setCatTag]       = useState("");
  const [rules,        setRules]        = useState<Rule[]>([]);
  const [defaultSize,  setDefaultSize]  = useState("M");
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState("");
  const [showForm,     setShowForm]     = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }

    let { data: merchant } = await supabase
      .from("merchants").select("id").eq("user_id", user.id).single();

    if (!merchant) {
      const { data: m } = await supabase
        .from("merchants").insert({ user_id: user.id, store_name: "متجري" })
        .select("id").single();
      merchant = m;
    }

    if (merchant) {
      setMerchantId(merchant.id);
      fetchCategories(merchant.id);
    }
  }

  async function fetchCategories(mid: string) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, tag, size_rules")
      .eq("merchant_id", mid)
      .order("created_at", { ascending: true });
    if (data) setCategories(data as Category[]);
  }

  function openNew() {
    setEditingCat(null);
    setCatName(""); setCatTag(""); setRules([]); setDefaultSize("M");
    setShowForm(true);
    setTimeout(() => document.getElementById("ssm-form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatTag(cat.tag || "");
    const { rules: r, defaultSize: d } = jsonToRules(cat.size_rules);
    setRules(r); setDefaultSize(d);
    setShowForm(true);
    setTimeout(() => document.getElementById("ssm-form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function cancelForm() { setShowForm(false); setEditingCat(null); }

  async function handleSave() {
    if (!catName.trim()) { alert("أدخل اسم الفئة"); return; }
    if (!catTag.trim())  { alert("أدخل الـ Tag (مثال: abaya)"); return; }
    if (!merchantId)     return;

    setSaving(true);
    const payload = {
      merchant_id: merchantId,
      name:        catName.trim(),
      tag:         catTag.trim().toLowerCase(),
      size_rules:  rulesToJson(rules, defaultSize),
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

  // ── Rule builder helpers ─────────────────────────────────────────────────

  function addRule() {
    setRules(r => [...r, { size: "M", conditions: [] }]);
  }

  function removeRule(ri: number) {
    setRules(r => r.filter((_, i) => i !== ri));
  }

  function updateRuleSize(ri: number, size: string) {
    setRules(r => r.map((rule, i) => i === ri ? { ...rule, size } : rule));
  }

  function addCondition(ri: number) {
    const defaultField: FieldKey = "height";
    const defaultOp: ConditionOp = "max";
    setRules(r => r.map((rule, i) =>
      i === ri
        ? { ...rule, conditions: [...rule.conditions, { field: defaultField, op: defaultOp, value: "" }] }
        : rule
    ));
  }

  function removeCondition(ri: number, ci: number) {
    setRules(r => r.map((rule, i) =>
      i === ri ? { ...rule, conditions: rule.conditions.filter((_, j) => j !== ci) } : rule
    ));
  }

  function updateCondition(ri: number, ci: number, patch: Partial<Condition>) {
    setRules(r => r.map((rule, i) => {
      if (i !== ri) return rule;
      const conds = rule.conditions.map((c, j) => j === ci ? { ...c, ...patch } : c);
      return { ...rule, conditions: conds };
    }));
  }

  // When field changes, reset op and value to sensible defaults
  function changeField(ri: number, ci: number, field: FieldKey) {
    const isNumber = FIELDS[field].type === "number";
    updateCondition(ri, ci, {
      field,
      op:    isNumber ? "max" : "eq",
      value: isNumber ? "" : (FIELDS[field].options?.[0]?.v ?? ""),
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">الفئات</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">فئات المنتجات</h1>
        <p className="text-slate-400 text-sm mt-1">حدّد قواعد المقاس لكل فئة — الـ Widget يستخدمها تلقائياً</p>
      </div>

      {toast && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm px-5 py-3 rounded-xl">
          {toast}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div id="ssm-form-top" className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
          {/* Form header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-lg">
              {editingCat ? `تعديل: ${editingCat.name}` : "فئة جديدة"}
            </h2>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">✕</button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">اسم الفئة</label>
                <input
                  type="text"
                  placeholder="مثال: عبايات نسائية"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  الـ Tag
                  <span className="font-normal text-slate-400 mr-1">(يُستخدم في الـ widget)</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: abaya"
                  value={catTag}
                  onChange={e => setCatTag(e.target.value.replace(/\s/g, "-"))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal-400 transition"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Size rules builder */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-black text-slate-900">قواعد المقاس</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تُقيَّم من الأولى للأخيرة — أول قاعدة تنطبق شروطها تُعطي المقاس</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500">الافتراضي:</label>
                    <select
                      value={defaultSize}
                      onChange={e => setDefaultSize(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-teal-400"
                    >
                      {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rules list */}
              <div className="space-y-3">
                {rules.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                    <p className="text-slate-400 text-sm">لا توجد قواعد — اضغط "إضافة قاعدة" لتبدأ</p>
                  </div>
                )}

                {rules.map((rule, ri) => (
                  <div key={ri} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Rule header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-400">المقاس:</span>
                      <select
                        value={rule.size}
                        onChange={e => updateRuleSize(ri, e.target.value)}
                        className="border border-slate-200 bg-white rounded-lg px-3 py-1 text-sm font-black text-teal-700 focus:outline-none focus:border-teal-400"
                      >
                        {ALL_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="text-xs text-slate-400 flex-1">إذا تحقق:</span>
                      <button
                        onClick={() => removeRule(ri)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold transition"
                      >
                        🗑 حذف
                      </button>
                    </div>

                    {/* Conditions */}
                    <div className="px-4 py-3 space-y-2">
                      {rule.conditions.length === 0 && (
                        <p className="text-xs text-slate-400 italic">بدون شروط — تنطبق دائماً (استخدمها كقاعدة افتراضية)</p>
                      )}

                      {rule.conditions.map((cond, ci) => {
                        const fieldMeta = FIELDS[cond.field];
                        const isNumber  = fieldMeta.type === "number";
                        return (
                          <div key={ci} className="flex items-center gap-2 flex-wrap">
                            {/* Field selector */}
                            <select
                              value={cond.field}
                              onChange={e => changeField(ri, ci, e.target.value as FieldKey)}
                              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-teal-400 bg-white"
                            >
                              {FIELD_KEYS.map(f => (
                                <option key={f} value={f}>{FIELDS[f].label}</option>
                              ))}
                            </select>

                            {/* Operator */}
                            {isNumber ? (
                              <select
                                value={cond.op}
                                onChange={e => updateCondition(ri, ci, { op: e.target.value as ConditionOp })}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-400 bg-white"
                              >
                                <option value="max">أقل من أو يساوي ≤</option>
                                <option value="min">أكبر من أو يساوي ≥</option>
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 px-2">=</span>
                            )}

                            {/* Value */}
                            {isNumber ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  placeholder="القيمة"
                                  value={cond.value}
                                  onChange={e => updateCondition(ri, ci, { value: e.target.value })}
                                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-24 focus:outline-none focus:border-teal-400"
                                />
                                <span className="text-xs text-slate-400">{fieldMeta.unit}</span>
                              </div>
                            ) : (
                              <select
                                value={cond.value}
                                onChange={e => updateCondition(ri, ci, { value: e.target.value })}
                                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-teal-400 bg-white"
                              >
                                {fieldMeta.options?.map(o => (
                                  <option key={o.v} value={o.v}>{o.label}</option>
                                ))}
                              </select>
                            )}

                            <button
                              onClick={() => removeCondition(ri, ci)}
                              className="text-slate-300 hover:text-red-400 font-bold text-lg leading-none transition"
                              title="حذف الشرط"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => addCondition(ri)}
                        className="text-teal-600 hover:text-teal-800 text-xs font-bold transition mt-1"
                      >
                        + إضافة شرط
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addRule}
                className="mt-3 w-full border-2 border-dashed border-teal-200 hover:border-teal-400 text-teal-600 hover:text-teal-800 font-bold text-sm py-3 rounded-xl transition"
              >
                + إضافة قاعدة
              </button>
            </div>

            {/* JSON preview (collapsible) */}
            <details className="bg-slate-50 border border-slate-200 rounded-xl">
              <summary className="px-4 py-3 text-xs font-bold text-slate-500 cursor-pointer select-none">
                معاينة JSON (للمطورين)
              </summary>
              <pre className="px-4 pb-4 text-xs text-slate-600 font-mono overflow-x-auto" dir="ltr">
                {JSON.stringify(rulesToJson(rules, defaultSize), null, 2)}
              </pre>
            </details>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-black text-sm transition"
              >
                {saving ? "جاري الحفظ..." : editingCat ? "حفظ التعديلات" : "حفظ الفئة"}
              </button>
              <button
                onClick={cancelForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <div className="flex justify-end mb-6">
          <button
            onClick={openNew}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition"
          >
            + فئة جديدة
          </button>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-3">
        {categories.length === 0 && !showForm && (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm mb-4">لا توجد فئات بعد</p>
            <button
              onClick={openNew}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition"
            >
              + أضف فئتك الأولى
            </button>
          </div>
        )}

        {categories.map(cat => {
          const { rules: r } = jsonToRules(cat.size_rules);
          return (
            <div
              key={cat.id}
              className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-black text-slate-900">{cat.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {cat.tag && (
                      <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                        #{cat.tag}
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">
                      {r.length > 0 ? `${r.length} قاعدة` : "بدون قواعد"}
                    </span>
                  </div>
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

      {/* How to use tag */}
      <div className="mt-8 bg-teal-50 border border-teal-100 rounded-2xl p-5">
        <h3 className="font-black text-teal-900 text-sm mb-2">🔗 كيف تربط الفئة بمنتجاتك؟</h3>
        <p className="text-teal-700 text-xs leading-relaxed">
          أضف هذا الكود في صفحة كل منتج، واستبدل <code className="bg-teal-100 px-1 rounded">TAG</code> بالـ tag الخاص بالفئة:
        </p>
        <pre className="mt-3 bg-white border border-teal-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 overflow-x-auto" dir="ltr">
          {`<meta name="product-tag" content="TAG">`}
        </pre>
      </div>
    </div>
  );
}
