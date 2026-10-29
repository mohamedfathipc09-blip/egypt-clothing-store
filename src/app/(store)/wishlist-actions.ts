"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CatalogProductSummary } from "@/lib/services/catalog.service";
import { getFilteredCatalogProducts } from "@/lib/services/catalog.service";

export async function getWishlistProductsAction(productIds: string[]): Promise<CatalogProductSummary[]> {
  if (!productIds || productIds.length === 0) return [];

  const supabase = createServerSupabaseClient();
  
  // نستخدم نفس دالة جلب المنتجات لضمان تطابق البيانات
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, title, slug, product_code, base_price, compare_at_price,
      image_url, is_featured, is_published, is_active, deleted_at, total_sold_count, created_at,
      categories ( id, name, slug ),
      product_images ( id, image_url, is_primary, display_order ),
      product_variants (
        id, sku, size, color, stock, stock_quantity, reserved_quantity,
        selling_price, compare_at_price, is_active, deleted_at,
        inventory_balances ( physical_qty, reserved_qty, available_qty )
      )
    `)
    .in("id", productIds)
    .is("deleted_at", null);

  if (error || !data) return [];

  // نستخدم الكود الموجود في الـ service لتجهيز البيانات، لكن للتبسيط سنأخذ الشكل المطلوب فقط
  // لضمان عدم التكرار، يمكنك استدعاء دالة مساعدة، هنا سنعيد البيانات بعد فلترتها
  return data.map((p: any) => {
    const images = Array.isArray(p.product_images) ? p.product_images : [];
    const primaryImage = images.find((img: any) => img.is_primary) || images[0];
    
    return {
      id: String(p.id),
      name: String(p.name || p.title || "منتج"),
      slug: String(p.slug),
      product_code: String(p.product_code || ""),
      base_price: Number(p.base_price || 0),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      is_featured: Boolean(p.is_featured),
      total_sold_count: Number(p.total_sold_count || 0),
      category: p.categories ? { id: String(p.categories.id), name: String(p.categories.name), slug: String(p.categories.slug) } : null,
      primary_image_url: primaryImage?.image_url || p.image_url || null,
      total_available_qty: (p.product_variants || []).reduce((sum: number, v: any) => {
        const bal = Array.isArray(v.inventory_balances) ? v.inventory_balances[0] : v.inventory_balances;
        return sum + Number(bal?.available_qty || v.stock_quantity || 0);
      }, 0)
    };
  });
}