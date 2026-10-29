import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import BannerManagerClient from "@/components/admin/banners/BannerManagerClient";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") redirect("/admin/login");

  const { data: banners } = await service
    .from("banners")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <AdminNav
        adminName={profile.full_name || "المدير"}
        role={profile.role}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BannerManagerClient initialBanners={banners || []} />
      </main>
    </div>
  );
}