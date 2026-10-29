"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { AdminRole } from "@/types/domain.types";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف"),
});

export interface LoginActionResult {
  success: boolean;
  error?: string;
}

export async function signInAdminAction(formData: {
  email: string;
  password: string;
}): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "بيانات الدخول غير صالحة",
    };
  }

  const supabase = createServerSupabaseClient();

  const { data: authData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    
if (signInError) console.error("SIGNIN ERROR:", signInError.message);
  if (signInError || !authData.user) {
    return {
      success: false,
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
          };
  }

  // التحقق من وجود سجل مشرف نشط في جدول profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    // إنهاء الجلسة فوراً إذا لم يكن المستخدم مشرفاً نشطاً
    await supabase.auth.signOut();
    return {
      success: false,
      error: "هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة أو أنه موقوف.",
    };
  }

  // تسجيل عملية الدخول في سجل التدقيق دون كشف أي بيانات سرية
  const serviceClient = createServiceRoleClient();
  await serviceClient.from("audit_logs").insert({
    actor_id: profile.id as string,
    actor_role: profile.role as AdminRole,
    action: "admin_login_success",
    entity_type: "profile",
    entity_id: profile.id as string,
    new_values: { email: authData.user.email },
  });

  return { success: true };
}

export async function signOutAdminAction(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}