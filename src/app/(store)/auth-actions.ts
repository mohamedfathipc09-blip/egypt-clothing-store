"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * تسجيل حساب جديد
 */
export async function registerCustomerAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!email || !password || !fullName || !phone) {
    return { error: "يرجى ملء جميع الحقول" };
  }

  if (password.length < 6) {
    return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
  }

  if (!/^01[0-9]{9}$/.test(phone)) {
    return { error: "رقم الموبايل غير صحيح (مثال: 01012345678)" };
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "customer",
      },
    },
  });

  if (error) {
    return { error: error.message }; // إظهار الخطأ الحقيقي
  }

  if (!data.user) {
    return { error: "تعذر إنشاء الحساب. حاول مرة أخرى." };
  }

  return { success: true };
}

/**
 * تسجيل الدخول
 */
export async function loginCustomerAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "يرجى إدخال البريد وكلمة المرور" };
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("Login Error:", error.message); // طباعة الخطأ في الـ Terminal
    
    if (error.message.includes("Email not confirmed")) {
      return { error: "لم يتم تأكيد بريدك الإلكتروني. يرجى مراجعة بريدك أو إيقاف التأكيد من إعدادات Supabase." };
    }
    if (error.message.includes("Invalid login credentials")) {
      return { error: "البريد أو كلمة المرور غير صحيحة" };
    }
    return { error: error.message }; // إظهار أي خطأ آخر
  }

  if (!data.user) {
    return { error: "تعذر تسجيل الدخول" };
  }

  return { success: true };
}

/**
 * تسجيل الخروج
 */
export async function logoutCustomerAction() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}