"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

async function assertAdmin(): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح بالدخول");

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    throw new Error("صلاحيات غير كافية");
  }
}

type CouponInput = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderSubtotal: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

function validateInput(input: CouponInput): string | null {
  const code = input.code.trim().toUpperCase();
  if (!code) return "كود الكوبون مطلوب";
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return "الكود يجب أن يكون 3-30 حرفًا (A-Z، 0-9، _، -) فقط";
  }
  if (!["percentage", "fixed"].includes(input.discountType)) {
    return "نوع الخصم غير صالح";
  }
  if (typeof input.discountValue !== "number" || input.discountValue <= 0) {
    return "قيمة الخصم يجب أن تكون أكبر من صفر";
  }
  if (input.discountType === "percentage" && input.discountValue > 100) {
    return "نسبة الخصم لا يمكن أن تتجاوز 100%";
  }
  if (input.minOrderSubtotal < 0) {
    return "الحد الأدنى لا يمكن أن يكون سالبًا";
  }
  if (input.maxDiscountAmount !== null && input.maxDiscountAmount < 0) {
    return "الحد الأقصى للخصم لا يمكن أن يكون سالبًا";
  }
  if (input.usageLimit !== null && input.usageLimit < 1) {
    return "حد الاستخدام يجب أن يكون 1 على الأقل";
  }
  if (input.expiresAt) {
    const start = new Date(input.startsAt);
    const end = new Date(input.expiresAt);
    if (end <= start) {
      return "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء";
    }
  }
  return null;
}

export async function createCouponAction(
  input: CouponInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const err = validateInput(input);
    if (err) return { success: false, error: err };

    const service = createServiceRoleClient();
    const { error } = await service.from("coupons").insert({
      code: input.code.trim().toUpperCase(),
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order_subtotal: input.minOrderSubtotal,
      min_order_amount: input.minOrderSubtotal,
      max_discount_amount: input.maxDiscountAmount,
      usage_limit: input.usageLimit,
      starts_at: input.startsAt,
      expires_at: input.expiresAt,
      is_active: input.isActive,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "هذا الكود مستخدم بالفعل" };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateCouponAction(
  id: string,
  input: CouponInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    if (!id) return { success: false, error: "معرف الكوبون مفقود" };

    const err = validateInput(input);
    if (err) return { success: false, error: err };

    const service = createServiceRoleClient();
    const { error } = await service
      .from("coupons")
      .update({
        code: input.code.trim().toUpperCase(),
        discount_type: input.discountType,
        discount_value: input.discountValue,
        min_order_subtotal: input.minOrderSubtotal,
        min_order_amount: input.minOrderSubtotal,
        max_discount_amount: input.maxDiscountAmount,
        usage_limit: input.usageLimit,
        starts_at: input.startsAt,
        expires_at: input.expiresAt,
        is_active: input.isActive,
      })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "هذا الكود مستخدم بالفعل" };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function toggleCouponActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    const service = createServiceRoleClient();
    const { error } = await service
      .from("coupons")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteCouponAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    const service = createServiceRoleClient();
    const { error } = await service.from("coupons").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}