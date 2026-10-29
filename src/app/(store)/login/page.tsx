"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { loginCustomerAction } from "../auth-actions";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginCustomerAction(formData);

    if (res.success) {
      router.push("/account");
      router.refresh();
    } else {
      setError(res.error || "حدث خطأ");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">مرحباً بعودتك</h1>
          <p className="text-gray-500 text-sm">سجل دخولك لمتابعة طلباتك</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
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
              <label className="block text-xs font-bold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 ps-11 text-sm focus:border-amber-500 focus:outline-none"
                />
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-amber-600 font-bold hover:underline">
                أنشئ حساباً جديداً
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          بالمتابعة، أنت توافق على{" "}
          <Link href="/policies/terms" className="underline">شروط البيع</Link>
          {" "}و{" "}
          <Link href="/policies/privacy" className="underline">سياسة الخصوصية</Link>
        </p>
      </div>
    </div>
  );
}