"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

async function assertAdmin(): Promise<void> {
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

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    throw new Error("صلاحيات غير كافية");
  }
}

/**
 * مزامنة الكمية بين inventory_balances و product_variants
 */
async function syncVariantQuantities(
  variantId: string,
  newPhysicalQty: number
): Promise<{ success: boolean; error?: string }> {
  const service = createServiceRoleClient();

  // 1) اقرأ reserved_qty الحالي
  const { data: balance } = await service
    .from("inventory_balances")
    .select("reserved_qty")
    .eq("variant_id", variantId)
    .maybeSingle();

  const reservedQty = Number(balance?.reserved_qty ?? 0);
  const availableQty = Math.max(0, newPhysicalQty - reservedQty);

  // 2) حدّث أو أنشئ سجل في inventory_balances
  if (balance) {
    const { error: balanceErr } = await service
      .from("inventory_balances")
      .update({
        physical_qty: newPhysicalQty,
        available_qty: availableQty,
        updated_at: new Date().toISOString(),
      })
      .eq("variant_id", variantId);

    if (balanceErr) return { success: false, error: balanceErr.message };
  } else {
    const { error: insertErr } = await service
      .from("inventory_balances")
      .insert({
        variant_id: variantId,
        physical_qty: newPhysicalQty,
        reserved_qty: 0,
        available_qty: newPhysicalQty,
        reorder_threshold: 5,
      });

    if (insertErr) return { success: false, error: insertErr.message };
  }

  // 3) حدّث product_variants (كل الأعمدة المتزامنة)
  const { error: variantErr } = await service
    .from("product_variants")
    .update({
      stock_quantity: newPhysicalQty,
      stock: newPhysicalQty,
    })
    .eq("id", variantId);

  if (variantErr) return { success: false, error: variantErr.message };

  return { success: true };
}

/**
 * تحديث كمية المخزون الفعلية
 */
export async function updateInventoryQuantityAction(input: {
  variantId: string;
  physicalQty: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    if (!input.variantId) {
      return { success: false, error: "معرف المتغير مفقود" };
    }
    if (
      typeof input.physicalQty !== "number" ||
      Number.isNaN(input.physicalQty) ||
      input.physicalQty < 0
    ) {
      return { success: false, error: "الكمية يجب أن تكون رقمًا موجبًا" };
    }

    const res = await syncVariantQuantities(
      input.variantId,
      Math.floor(input.physicalQty)
    );

    if (res.success) {
      revalidatePath("/admin/inventory");
      revalidatePath("/admin/products");
      revalidatePath("/admin/dashboard");
    }

    return res;
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * زيادة/إنقاص الكمية (delta)
 */
export async function adjustInventoryQuantityAction(input: {
  variantId: string;
  delta: number;
}): Promise<{ success: boolean; error?: string; newQty?: number }> {
  try {
    await assertAdmin();

    if (!input.variantId) {
      return { success: false, error: "معرف المتغير مفقود" };
    }
    if (typeof input.delta !== "number" || Number.isNaN(input.delta)) {
      return { success: false, error: "مقدار التغيير غير صالح" };
    }

    const service = createServiceRoleClient();
    const { data: balance } = await service
      .from("inventory_balances")
      .select("physical_qty")
      .eq("variant_id", input.variantId)
      .maybeSingle();

    const { data: variant } = await service
      .from("product_variants")
      .select("stock_quantity, stock")
      .eq("id", input.variantId)
      .single();

    const currentQty = Number(
      balance?.physical_qty ??
        variant?.stock_quantity ??
        variant?.stock ??
        0
    );

    const newQty = Math.max(0, currentQty + Math.floor(input.delta));

    const res = await syncVariantQuantities(input.variantId, newQty);
    if (res.success) {
      revalidatePath("/admin/inventory");
      revalidatePath("/admin/products");
      revalidatePath("/admin/dashboard");
      return { success: true, newQty };
    }
    return res;
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * تحديث حد التنبيه (reorder_threshold)
 */
export async function updateReorderThresholdAction(input: {
  variantId: string;
  threshold: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    if (!input.variantId) {
      return { success: false, error: "معرف المتغير مفقود" };
    }
    if (
      typeof input.threshold !== "number" ||
      Number.isNaN(input.threshold) ||
      input.threshold < 0
    ) {
      return { success: false, error: "حد التنبيه يجب أن يكون رقمًا موجبًا" };
    }

    const service = createServiceRoleClient();

    const { data: balance } = await service
      .from("inventory_balances")
      .select("id")
      .eq("variant_id", input.variantId)
      .maybeSingle();

    if (balance) {
      const { error } = await service
        .from("inventory_balances")
        .update({ reorder_threshold: Math.floor(input.threshold) })
        .eq("variant_id", input.variantId);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await service.from("inventory_balances").insert({
        variant_id: input.variantId,
        physical_qty: 0,
        reserved_qty: 0,
        available_qty: 0,
        reorder_threshold: Math.floor(input.threshold),
      });
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}