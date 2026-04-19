"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type SizeRow = { size: string; [key: string]: string };
type Category = { id: string; name: string };

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [columns, setColumns] = useState<string[]>(["الصدر (سم)", "الخصر (سم)"]);
  const [newColumn, setNewColumn] = useState("");
  const [rows, setRows] = useState<SizeRow[]>(DEFAULT_SIZES.map((s) => ({ size: s })));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    initMerchant();
  }, []);

  async function initMerchant() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { window.location.href = "/auth"; return; }

    let { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (!merchant) {
      const { data: newMerchant } = await supabase
        .from("merchants")
        .insert({ user_id: userData.user.id, store_name: "متجري" })
        .select("id")
        .single();
      merchant = newMerchant;
    }

    if (merchant) {
      setMerchantId(merchant.id);
      fetchCategories(merchant.id);
    }
  }

  async function fetchCategories(mid: string) {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("merchant_id", mid);
    if (data) setCategories(data);
  }

  function addColumn() {
    if (!newColumn.trim()) return;
    setColumns([...columns, newColumn.trim()]);
    setNewColumn("");
  }

  function removeColumn(col: string) {
    setColumns(columns.filter((c) => c !== col));
  }

  function updateCell(i: number, col: string, value: string) {
    const updated = [...rows];
    updated[i][col] = value;
    setRows(updated);
  }

  function resetForm() {
    setCategoryName("");
    setColumns(["الصدر (سم)", "الخصر (سم)"]);
    setRows(DEFAULT_SIZES.map((s) => ({ size: s })));
    setEditingId(null);
    setShowForm(false);
  }

  async function handleEdit(cat: Category) {
    setCategoryName(cat.name);
    setEditingId(cat.id);

    const { data: chart } = await supabase
      .from("size_charts")
      .select("chart_data")
      .eq("category_id", cat.id)
      .single();

    if (chart?.chart_data) {
      setColumns(chart.chart_data.columns || []);
      setRows(chart.chart_data.rows || DEFAULT_SIZES.map((s) => ({ size: s })));
    }

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!categoryName.trim()) { setMessage("أدخل اسم الفئة"); return; }
    if (!merchantId) return;
    setLoading(true);
    setMessage("");

    if (editingId) {
      await supabase.from("categories").update({ name: categoryName }).eq("id", editingId);
      await supabase.from("size_charts")
        .update({ chart_data: { columns, rows } })
        .eq("category_id", editingId);
      setMessage("تم التعديل بنجاح!");
    } else {
      const { data: category } = await supabase
        .from("categories")
        .insert({ merchant_id: merchantId, name: categoryName })
        .select("id")
        .single();

      if (category) {
        await supabase.from("size_charts").insert({
          category_id: category.id,
          chart_data: { columns, rows },
        });
      }
      setMessage("تم الحفظ بنجاح!");
    }

    resetForm();
    fetchCategories(merchantId);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    if (merchantId) fetchCategories(merchantId);
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <a href="/dashboard" className="text-blue-600 font-bold">← لوحة التحكم</a>
        <h1 className="text-xl font-bold">الفئات</h1>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {message && <p className="mb-4 text-green-600 font-bold">{message}</p>}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">فئاتي</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + إضافة فئة جديدة
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? "تعديل الفئة" : "فئة جديدة"}
            </h3>

            <input
              type="text"
              placeholder="اسم الفئة (مثال: عبايات نسائية)"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="border rounded-lg p-3 w-full mb-4 text-right"
            />

            <div className="mb-4">
              <p className="font-bold mb-2">أعمدة القياسات:</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="مثال: الورك (سم)"
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
                  className="border rounded-lg p-2 flex-1 text-right"
                />
                <button
                  onClick={addColumn}
                  className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  + إضافة عمود
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <span key={col} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {col}
                    <button onClick={() => removeColumn(col)} className="text-red-500 font-bold hover:text-red-700">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">المقاس</th>
                    {columns.map((col) => (
                      <th key={col} className="border border-gray-300 p-2">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.size}>
                      <td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">{row.size}</td>
                      {columns.map((col) => (
                        <td key={col} className="border border-gray-300 p-1">
                          <input
                            type="number"
                            value={row[col] || ""}
                            onChange={(e) => updateCell(i, col, e.target.value)}
                            className="w-full p-1 text-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {loading ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "حفظ الفئة"}
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {categories.length === 0 && (
            <p className="text-gray-500 text-center py-8">لا توجد فئات بعد. أضف فئة جديدة!</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
              <span className="font-bold">{cat.name}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-blue-500 hover:text-blue-700 text-sm font-bold"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
