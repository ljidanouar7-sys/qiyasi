"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Category = { id: string; name: string };
type Product = { id: string; name: string; category_id: string; is_active: boolean };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
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
      fetchData(merchant.id);
    }
  }

  async function fetchData(mid: string) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name")
      .eq("merchant_id", mid);
    if (cats) setCategories(cats);

    const { data: prods } = await supabase
      .from("products")
      .select("id, name, category_id, is_active")
      .eq("merchant_id", mid);
    if (prods) setProducts(prods);
  }

  async function handleSave() {
    if (!productName.trim()) { setMessage("أدخل اسم المنتج"); return; }
    if (!selectedCategory) { setMessage("اختر فئة للمنتج"); return; }
    if (!merchantId) return;
    setLoading(true);
    setMessage("");

    await supabase.from("products").insert({
      merchant_id: merchantId,
      name: productName,
      category_id: selectedCategory,
      is_active: true,
    });

    setMessage("تم إضافة المنتج بنجاح!");
    setProductName("");
    setSelectedCategory("");
    setShowForm(false);
    fetchData(merchantId);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("products").delete().eq("id", id);
    if (merchantId) fetchData(merchantId);
  }

  function getCategoryName(catId: string) {
    return categories.find((c) => c.id === catId)?.name || "-";
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <a href="/dashboard" className="text-blue-600 font-bold">← لوحة التحكم</a>
        <h1 className="text-xl font-bold">المنتجات</h1>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {message && <p className="mb-4 text-green-600 font-bold">{message}</p>}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">منتجاتي</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + إضافة منتج جديد
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-4">منتج جديد</h3>

            <input
              type="text"
              placeholder="اسم المنتج (مثال: عباية سوداء كلاسيكية)"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="border rounded-lg p-3 w-full mb-4 text-right"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-lg p-3 w-full mb-4 text-right"
            >
              <option value="">-- اختر الفئة --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {categories.length === 0 && (
              <p className="text-red-500 text-sm mb-4">
                ما عندكش فئات بعد!{" "}
                <a href="/dashboard/categories" className="underline">أضف فئة أولاً</a>
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {loading ? "جاري الحفظ..." : "حفظ المنتج"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {products.length === 0 && (
            <p className="text-gray-500 text-center py-8">لا توجد منتجات بعد. أضف منتجاً جديداً!</p>
          )}
          {products.map((prod) => (
            <div key={prod.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <span className="font-bold">{prod.name}</span>
                <span className="text-gray-500 text-sm mr-3">({getCategoryName(prod.category_id)})</span>
              </div>
              <button
                onClick={() => handleDelete(prod.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
