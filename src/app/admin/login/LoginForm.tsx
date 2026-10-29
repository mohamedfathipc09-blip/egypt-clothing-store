"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { signInAdminAction } from "./actions";

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await signInAdminAction({ email, password });
      if (!result.success) {
        setErrorMsg(result.error ?? "تعذر تسجيل الدخول");
        setIsSubmitting(false);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setErrorMsg("حدث خطأ غير متوقع أثناء الاتصال بالخادم.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">لوحة إدارة المتجر</h1>
        <p className="text-sm text-gray-400 mt-1">
          الدخول مخصص للمشرفين المصرح لهم فقط
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl bg-red-950/70 border border-red-800 p-4 text-sm text-red-200"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300 mb-2">
            البريد الإلكتروني الإداري
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-500 absolute start-3.5 top-3" />
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="admin@example.com"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 ps-11 pe-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-gray-300 mb-2">
            كلمة المرور
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-500 absolute start-3.5 top-3" />
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 ps-11 pe-4 py-2.5 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold py-3 px-4 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري التحقق من الصلاحيات...</span>
            </>
          ) : (
            <span>تسجيل الدخول</span>
          )}
        </button>
      </form>
    </div>
  );
}