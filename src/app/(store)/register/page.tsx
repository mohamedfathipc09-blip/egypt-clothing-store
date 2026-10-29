"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Loader2, AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { registerCustomerAction } from "../auth-actions";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await registerCustomerAction(formData);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError(res.error || "حدث خطأ");
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">تم إنشاء حسابك بنجاح!</h1>
          <p className="text-sm text-gray-500 mb-6">جاري تحويلك لصفحة تسجيل الدخول...</p>
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-500 text-sm">انضم إلينا للحصول على تجربة تسوق أفضل</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">الاسم الكامل *</label>
              <div className="relative">
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="محمد أحمد"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 ps-11 text-sm focus:border-amber-500 focus:outline-none"
                />
                <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">البريد الإلكتروني *</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 ps-11 text-sm focus:border-amber-500 focus:outline-none"
                />
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">رقم الموبايل *</label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="01012345678"
                  pattern="01[0-9]{9}"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 ps-11 text-sm focus:border-amber-500 focus:outline-none"
                />
                <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">كلمة المرور *</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="6 أحرف على الأقل"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 ps-11 text-sm focus:border-amber-500 focus:outline-none"
                />
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-amber-600 font-bold hover:underline">
                سجل دخولك
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}