import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import ProductsManagerClient from "./ProductsManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) redirect("/admin/login");

  const service = createServiceRoleClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    service
      .from("products")
      .select("id, title, slug, base_price, is_active, product_variants(id, sku, size, color, stock_quantity)")
      .order("created_at", { ascending: false }),
    service.from("categories").select("id, name").order("name"),
  ]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-gray-100">
      <AdminNav adminName={profile.full_name} role={profile.role} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductsManagerClient
          products={products ?? []}
          categories={categories ?? []}
        />
      </main>
    </div>
  );
}