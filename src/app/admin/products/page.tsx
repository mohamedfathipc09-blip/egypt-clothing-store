import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import ProductsManagerClient from "./ProductsManagerClient";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
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

  if (!["owner", "admin", "inventory_manager", "order_manager", "viewer"].includes(profile.role)) {
    redirect("/");
  }

  const { data: categories } = await service
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: rawProducts } = await service
    .from("products")
    .select(`
      *,
      product_variants (
        *,
        inventory_balances (*)
      )
    `)
    .order("created_at", { ascending: false });

  const products = (rawProducts || []).map((product) => ({
    ...product,
    product_variants: (product.product_variants || []).map((variant: any) => {
      const inv = Array.isArray(variant.inventory_balances)
        ? variant.inventory_balances[0]
        : variant.inventory_balances;

      return {
        ...variant,
        stock_quantity: inv?.available_qty ?? variant?.stock_quantity ?? variant?.stock ?? 0,
      };
    }),
  }));

  return (
    // ✅ هنا غيرنا الخلفية لـ bg-white وشيلنا max-w-7xl عشان تاخد الشاشة كلها
    <div dir="rtl" className="min-h-screen bg-white">
      <AdminNav
        adminName={profile?.full_name || "المدير"}
        role={profile?.role || "admin"}
      />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-white">
        <ProductsManagerClient
          products={products}
          categories={categories || []}
        />
      </main>
    </div>
  );
}