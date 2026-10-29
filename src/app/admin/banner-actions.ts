"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح");

  const service = createServiceRoleClient();
  const { data: profile } = await service.from("profiles").select("role, is_active").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) throw new Error("صلاحيات غير كافية");
}

export async function saveBannerAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const cta_text = formData.get("cta_text") as string;
    const cta_link = formData.get("cta_link") as string;
    const display_order = Number(formData.get("display_order") || 0);
    const is_active = formData.get("is_active") === "true";
    const imageFile = formData.get("image_file") as File | null;

    const service = createServiceRoleClient();
    let imageUrl = formData.get("current_image_url") as string;

    if (imageFile && imageFile.size > 0) {
      const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `banner_${Date.now()}.${ext}`;
      const { error: uploadErr } = await service.storage.from("product-images").upload(path, imageFile);
      if (uploadErr) return { success: false, error: "فشل رفع الصورة: " + uploadErr.message };
      
      const { data: urlData } = service.storage.from("product-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    if (!imageUrl) return { success: false, error: "صورة البانر مطلوبة" };

    const payload = { title, subtitle, cta_text, cta_link, display_order, is_active, image_url: imageUrl };

    if (id) {
      const { error } = await service.from("banners").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await service.from("banners").insert(payload);
      if (error) throw error;
    }

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteBannerAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    const service = createServiceRoleClient();
    const { error } = await service.from("banners").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function toggleBannerAction(id: string, isActive: boolean): Promise<{ success: boolean }> {
  await assertAdmin();
  const service = createServiceRoleClient();
  await service.from("banners").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}