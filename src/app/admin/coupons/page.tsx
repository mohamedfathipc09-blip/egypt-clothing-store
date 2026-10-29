import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import CouponsManagerClient from "./CouponsManagerClient";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active || profile.role !== "admin") {
    redirect("/admin/login");
  }

  const { data: coupons, error } = await service
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Coupons fetch error:", error.message);
  }

  const normalized = (coupons ?? []).map((c: any) => ({
    id: String(c.id),
    code: String(c.code),
    discountType: (c.discount_type === "fixed" ? "fixed" : "percentage") as "percentage" | "fixed",
    discountValue: Number(c.discount_value ?? 0),
    minOrderSubtotal: Number(c.min_order_subtotal ?? c.min_order_amount ?? 0),
    maxDiscountAmount:
      c.max_discount_amount !== null && c.max_discount_amount !== undefined
        ? Number(c.max_discount_amount)
        : null,
    usageLimit: c.usage_limit !== null && c.usage_limit !== undefined ? Number(c.usage_limit) : null,
    usedCount: Number(c.used_count ?? 0),
    startsAt: String(c.starts_at),
    expiresAt: c.expires_at ? String(c.expires_at) : null,
    isActive: Boolean(c.is_active),
    createdAt: String(c.created_at),
  }));

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <AdminNav
        adminName={profile.full_name || "المدير"}
        role={profile.role}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CouponsManagerClient initialCoupons={normalized} />
      </main>
    </div>
  );
}