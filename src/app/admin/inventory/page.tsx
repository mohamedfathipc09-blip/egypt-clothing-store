import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import InventoryManagerClient from "./InventoryManagerClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const service = createServiceRoleClient();

  const { data: profile } = await service
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) redirect("/admin/login");

  // ✅ فحص الصلاحيات (Role Check) الجديد
  if (!["owner", "admin", "inventory_manager", "order_manager", "viewer"].includes(profile.role)) {
    redirect("/");
  }

  const { data: variants, error } = await service
    .from("product_variants")
    .select(`
      id, sku, size, color, stock, stock_quantity, reserved_quantity,
      selling_price, is_active, deleted_at, created_at,
      products ( id, title, name, base_price, cost_price, image_url ),
      inventory_balances ( id, physical_qty, reserved_qty, available_qty, reorder_threshold )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Inventory fetch error:", error.message);
  }

  const normalized = (variants ?? []).map((v: any) => {
    const inv = Array.isArray(v.inventory_balances)
      ? v.inventory_balances[0]
      : v.inventory_balances;

    const physicalQty = Number(inv?.physical_qty ?? v.stock_quantity ?? v.stock ?? 0);
    const reservedQty = Number(inv?.reserved_qty ?? v.reserved_quantity ?? 0);
    const availableQty = Number(inv?.available_qty ?? Math.max(0, physicalQty - reservedQty));
    const reorderThreshold = Number(inv?.reorder_threshold ?? 5);

    return {
      id: String(v.id),
      sku: String(v.sku ?? ""),
      size: String(v.size ?? ""),
      color: String(v.color ?? ""),
      is_active: Boolean(v.is_active),
      selling_price: Number(v.selling_price ?? 0),
      product_id: String(v.products?.id ?? ""),
      product_title: String(v.products?.title || v.products?.name || "منتج"),
      product_image: v.products?.image_url ?? null,
      base_price: Number(v.products?.base_price ?? 0),
      cost_price: Number(v.products?.cost_price ?? 0),
      physical_qty: physicalQty,
      reserved_qty: reservedQty,
      available_qty: availableQty,
      reorder_threshold: reorderThreshold,
    };
  });

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <AdminNav
        adminName={profile.full_name || "المدير"}
        role={profile.role}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InventoryManagerClient variants={normalized} />
      </main>
    </div>
  );
}