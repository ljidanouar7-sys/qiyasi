import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "المقاس الذكي — Smart Size Matcher",
  description: "أداة ذكية تساعد متاجر العبايات والجلابيب على تقليل المرتجعات وزيادة المبيعات",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
