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

/**
 * تحديث تفاصيل منتج (عنوان، وصف، قسم، صورة)
 */
export async function updateProductDetailsAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const productId = formData.get("product_id") as string;
    const title = (formData.get("title") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const categoryId = (formData.get("category_id") as string) || null;
    const imageFile = formData.get("image_file") as File | null;

    if (!productId) return { success: false, error: "معرف المنتج مفقود" };
    if (!title) return { success: false, error: "اسم المنتج مطلوب" };

    const service = createServiceRoleClient();
    let imageUrl: string | null = null;

    // 1) رفع صورة جديدة إن وُجدت
    if (imageFile && imageFile.size > 0) {
      const ext = imageFile.name.split(".").pop()?.toLowerCase() || "webp";
      const path = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadErr } = await service.storage
        .from("product-images")
        .upload(path, imageFile, { cacheControl: "3600", upsert: false });

      if (uploadErr) {
        return { success: false, error: `فشل رفع الصورة: ${uploadErr.message}` };
      }

      const { data: urlData } = service.storage
        .from("product-images")
        .getPublicUrl(path);

      imageUrl = urlData.publicUrl;
    }

    // 2) تحديث المنتج
    const updatePayload: any = {
      title,
      name: title, // مزامنة
      slug: slug || title,
      description,
      category_id: categoryId || null,
    };

    if (imageUrl) {
      updatePayload.image_url = imageUrl;
    }

    const { error: updateErr } = await service
      .from("products")
      .update(updatePayload)
      .eq("id", productId);

    if (updateErr) return { success: false, error: updateErr.message };

    // 3) تحديث جدول الصور (product_images) إن وُجدت صورة جديدة
    if (imageUrl) {
      // احذف الصورة الأساسية القديمة
      await service
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);

      // أضف الصورة الجديدة
      await service.from("product_images").insert({
        product_id: productId,
        image_url: imageUrl,
        is_primary: true,
        display_order: 0,
      });
    }

    // 4) تحديث الكاش
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${slug || title}`);
    revalidatePath("/");

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}