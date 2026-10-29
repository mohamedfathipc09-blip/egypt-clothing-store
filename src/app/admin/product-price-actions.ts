"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * التحقق من أن المستخدم الحالي admin نشط
 */
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
 * تحديث أسعار منتج (سعر البيع + التكلفة + سعر المقارنة)
 */
export async function updateProductPricesAction(input: {
  productId: string;
  basePrice: number;
  costPrice: number;
  compareAtPrice: number | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const { productId, basePrice, costPrice, compareAtPrice } = input;

    if (!productId || typeof productId !== "string") {
      return { success: false, error: "معرف المنتج مفقود" };
    }

    if (
      typeof basePrice !== "number" ||
      typeof costPrice !== "number" ||
      Number.isNaN(basePrice) ||
      Number.isNaN(costPrice) ||
      basePrice < 0 ||
      costPrice < 0
    ) {
      return { success: false, error: "الأسعار يجب أن تكون أرقامًا موجبة" };
    }

    if (costPrice > basePrice) {
      return {
        success: false,
        error: "سعر التكلفة لا يمكن أن يكون أكبر من سعر البيع",
      };
    }

    if (compareAtPrice !== null && compareAtPrice <= basePrice) {
      return {
        success: false,
        error: "السعر قبل الخصم يجب أن يكون أكبر من سعر البيع",
      };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("products")
      .update({
        base_price: basePrice,
        price: basePrice, // مزامنة مع حقل price القديم
        cost_price: costPrice,
        compare_at_price: compareAtPrice,
      })
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    // تحديث جميع الصفحات ذات الصلة
    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    revalidatePath(`/products`);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * تحديث التكلفة فقط (للتعديل السريع Inline)
 */
export async function updateProductCostOnlyAction(
  productId: string,
  costPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    if (!productId) {
      return { success: false, error: "معرف المنتج مفقود" };
    }
    if (typeof costPrice !== "number" || Number.isNaN(costPrice) || costPrice < 0) {
      return { success: false, error: "التكلفة يجب أن تكون رقمًا موجبًا" };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("products")
      .update({ cost_price: costPrice })
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}