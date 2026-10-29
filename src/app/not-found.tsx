import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div dir="rtl" className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
      <span className="text-6xl font-extrabold text-amber-600">404</span>
      <h1 className="text-2xl font-bold text-gray-900">الصفحة المطلوبة غير موجودة</h1>
      <p className="text-sm text-gray-600 max-w-md">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-amber-600 transition"
      >
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}