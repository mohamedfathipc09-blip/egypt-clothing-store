import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import AdminsManagerClient from "./AdminsManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const service = createServiceRoleClient();
  const { data: myProfile } = await service
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!myProfile || !myProfile.is_active) redirect("/admin/login");
  if (!["admin", "owner"].includes(myProfile.role)) {
    redirect("/admin/dashboard");
  }

  // جلب جميع المشرفين (كل من ليس دوره customer)
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, phone, role, is_active, created_at")
    .in("role", [
      "owner",
      "admin",
      "inventory_manager",
      "order_manager",
      "viewer",
    ])
    .order("created_at", { ascending: false });

  // جلب البريد الإلكتروني من auth.users
  const { data: authUsers } = await service.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailMap = new Map(
    (authUsers?.users || []).map((u) => [u.id, u.email || ""])
  );

  const admins = (profiles || []).map((p) => ({
    id: p.id,
    full_name: p.full_name || "بدون اسم",
    phone: p.phone || "",
    role: p.role,
    is_active: p.is_active,
    created_at: p.created_at,
    email: emailMap.get(p.id) || "",
  }));

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <AdminNav
        adminName={myProfile.full_name || "المدير"}
        role={myProfile.role}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminsManagerClient
          initialAdmins={admins}
          currentUserId={user.id}
        />
      </main>
    </div>
  );
}