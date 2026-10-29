import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { AdminRole } from "@/types/domain.types";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: AdminRole;
  is_active: boolean;
}

/**
 * مجموعات الصلاحيات القياسية لتوحيد الفحص عبر جميع ملفات المشروع
 */
export const ROLE_PERMISSIONS = {
  ALL_STAFF: ["owner", "admin", "inventory_manager", "order_manager", "viewer"] as AdminRole[],
  OWNER_ONLY: ["owner"] as AdminRole[],
  MANAGEMENT: ["owner", "admin"] as AdminRole[],
  CATALOG_AND_INVENTORY: ["owner", "admin", "inventory_manager"] as AdminRole[],
  ORDERS_AND_RETURNS: ["owner", "admin", "order_manager"] as AdminRole[],
};

/**
 * جلب بيانات المشرف الحالي من الخادم والتحقق من تفعيل حسابه
 */
export async function getCurrentAdminProfile(): Promise<AuthenticatedAdmin | null> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    return null;
  }

  return {
    id: profile.id as string,
    email: user.email ?? "",
    full_name: profile.full_name as string,
    phone: (profile.phone as string | null) ?? null,
    role: profile.role as AdminRole,
    is_active: Boolean(profile.is_active),
  };
}

/**
 * حارس صفحات الإدارة (يريد التوجيه لصفحة الدخول أو يرفض الوصول إذا كان الدور غير كافٍ)
 */
export async function requireAdminPageAccess(
  allowedRoles: AdminRole[] = ROLE_PERMISSIONS.ALL_STAFF
): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdminProfile();

  if (!admin) {
    redirect("/admin/login");
  }

  if (!allowedRoles.includes(admin.role)) {
    redirect("/admin/dashboard?error=unauthorized_role");
  }

  return admin;
}

/**
 * حارس العمليات الخادمية (Server Actions & Route Handlers)
 * يرمي خطأً صريحاً يمنع تنفيذ العملية إذا لم يمتلك المستخدم الصلاحية المطلوبة
 */
export async function requireAdminActionPermission(
  allowedRoles: AdminRole[]
): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdminProfile();

  if (!admin) {
    throw new Error("غير مصرح: يرجى تسجيل الدخول أولاً لتنفيذ هذه العملية.");
  }

  if (!allowedRoles.includes(admin.role)) {
    throw new Error(
      `صلاحيات غير كافية: دورك الحالي (${getRoleLabelAr(admin.role)}) لا يسمح بتنفيذ هذا الإجراء.`
    );
  }

  return admin;
}

/**
 * تسجيل العمليات الإدارية الحساسة في سجل التدقيق (audit_logs)
 */
export async function recordAuditLog(params: {
  actor: AuthenticatedAdmin;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}): Promise<void> {
  const serviceClient = createServiceRoleClient();

  await serviceClient.from("audit_logs").insert({
    actor_id: params.actor.id,
    actor_role: params.actor.role,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    old_values: params.oldValues ?? null,
    new_values: params.newValues ?? null,
  });
}

export function getRoleLabelAr(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    owner: "مالك المتجر",
    admin: "مدير عام",
    inventory_manager: "مسؤول المخزون والمنتجات",
    order_manager: "مسؤول الطلبات والعملاء",
    viewer: "مراقب (قراءة فقط)",
  };
  return labels[role];
}