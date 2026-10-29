"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function searchProductsAction(query: string) {
  if (!query || query.trim().length < 2) return [];
  
  const supabase = createServerSupabaseClient();
  const cleanQuery = query.trim();
  
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, title, slug, base_price, image_url,
      product_images ( image_url, is_primary, display_order )
    `)
    .or(`name.ilike.%${cleanQuery}%,title.ilike.%${cleanQuery}%`)
    .eq("is_published", true)
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(6); // نعرض 6 نتائج كحد أقصى في القائمة المنسدلة

  if (error) {
    console.error("Search error:", error.message);
    return [];
  }

  // تجهيز الصورة الرئيسية
  return (data || []).map((product) => {
    const images = Array.isArray(product.product_images) ? product.product_images : [];
    const primaryImage = images.find((img: any) => img.is_primary) || images[0];
    
    return {
      id: String(product.id),
      name: String(product.name || product.title || "منتج"),
      slug: String(product.slug),
      price: Number(product.base_price || 0),
      image: primaryImage?.image_url || product.image_url || null,
    };
  });
}