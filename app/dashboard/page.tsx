"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/auth";
      } else {
        setUserEmail(data.user.email || "");
      }
    }
    getUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Smart Size Matcher</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
          >
            تسجيل الخروج
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">لوحة التحكم</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/dashboard/categories"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100"
          >
            <div className="text-3xl mb-2">📂</div>
            <h3 className="text-lg font-bold">الفئات</h3>
            <p className="text-gray-500 text-sm">إدارة فئات المنتجات وجداول المقاسات</p>
          </a>

          <a
            href="/dashboard/products"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100"
          >
            <div className="text-3xl mb-2">👗</div>
            <h3 className="text-lg font-bold">المنتجات</h3>
            <p className="text-gray-500 text-sm">إدارة منتجاتك وربطها بالفئات</p>
          </a>

          <a
            href="/dashboard/embed"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100"
          >
            <div className="text-3xl mb-2">🔗</div>
            <h3 className="text-lg font-bold">كود التضمين</h3>
            <p className="text-gray-500 text-sm">احصل على كود الـ widget لموقعك</p>
          </a>
        </div>
      </div>
    </div>
  );
}
