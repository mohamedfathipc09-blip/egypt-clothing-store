"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// ✅ إجبار Next.js على تحميل الفورم في المتصفح فقط وتخطي البناء على السيرفر
const LoginForm = dynamic(() => import("./LoginForm"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  ),
});

export default function AdminLoginPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 flex flex-col justify-center items-center px-4 py-12 text-gray-100">
      <LoginForm />
    </div>
  );
}