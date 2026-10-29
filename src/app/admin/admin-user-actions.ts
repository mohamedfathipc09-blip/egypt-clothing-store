"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = [
  "owner",
  "admin",
  "inventory_manager",
  "order_manager",
  "viewer",
];

async function requireOwnerOrAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح بالدخول");

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) throw new Error("حسابك غير نشط");
  if (!["admin", "owner"].includes(profile.role)) {
    throw new Error("فقط المدراء يمكنهم إدارة حسابات المشرفين");
  }

  return { user, profile, service };
}

export async function createAdminUserAction(formData: FormData) {
  try {
    const { service } = await requireOwnerOrAdmin();

    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const full_name = String(formData.get("full_name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const role = String(formData.get("role") || "admin");

    if (!email || !password || !full_name) {
      return { success: false, error: "يرجى ملء جميع الحقول المطلوبة" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "البريد الإلكتروني غير صحيح" };
    }
    if (password.length < 8) {
      return {
        success: false,
        error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      };
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return { success: false, error: "الدور غير صالح" };
    }

    // ✅ إنشاء المستخدم بدون تمرير role في metadata
    //    (لتجنب فشل الـ trigger إذا لم يكن القيد محدّثاً)
    const { data: authData, error: authError } =
      await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
          // ❌ لا نمرر role هنا - سنضبطه يدوياً بعد الإنشاء
        },
      });

    if (authError || !authData.user) {
      const msg = authError?.message || "تعذر إنشاء الحساب";
      console.error("Auth createUser error:", authError);

      if (msg.toLowerCase().includes("already")) {
        return { success: false, error: "هذا البريد مسجل بالفعل" };
      }
      if (msg.toLowerCase().includes("database error")) {
        return {
          success: false,
          error:
            "خطأ في قاعدة البيانات: تأكد من تحديث CHECK constraint على profiles.role",
        };
      }
      return { success: false, error: msg };
    }

    // ✅ تأكيد إنشاء/تحديث الملف الشخصي (upsert بدلاً من update)
    const { error: profileErr } = await service.from("profiles").upsert(
      {
        id: authData.user.id,
        full_name,
        phone: phone || null,
        role,
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      // إذا فشل إنشاء الملف، نحذف المستخدم لتجنب حساب يتيم
      await service.auth.admin.deleteUser(authData.user.id);
      console.error("Profile upsert error:", profileErr);
      return {
        success: false,
        error: `فشل إنشاء الملف الشخصي: ${profileErr.message}`,
      };
    }

    revalidatePath("/admin/admins");
    return { success: true };
  } catch (e) {
    console.error("createAdminUserAction error:", e);
    return { success: false, error: (e as Error).message };
  }
}

export async function toggleAdminActiveAction(id: string, isActive: boolean) {
  try {
    const { user, service } = await requireOwnerOrAdmin();
    if (user.id === id) {
      return { success: false, error: "لا يمكنك تعطيل حسابك الشخصي" };
    }

    const { error } = await service
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/admins");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteAdminUserAction(id: string) {
  try {
    const { user, service } = await requireOwnerOrAdmin();
    if (user.id === id) {
      return { success: false, error: "لا يمكنك حذف حسابك الشخصي" };
    }

    const { error } = await service.auth.admin.deleteUser(id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/admins");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateAdminRoleAction(id: string, role: string) {
  try {
    const { service } = await requireOwnerOrAdmin();
    if (!ALLOWED_ROLES.includes(role)) {
      return { success: false, error: "الدور غير صالح" };
    }

    const { error } = await service
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/admins");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}