import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import OrderStatusSelect from "./OrderStatusSelect";
import ExportOrdersButton from "./ExportOrdersButton";
import { ShoppingBag, Package, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
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

  // ✅ فحص الصلاحيات (Role Check) الجديد
  if (!["owner", "admin", "inventory_manager", "order_manager", "viewer"].includes(profile.role)) {
    redirect("/");
  }

  const service = createServiceRoleClient();
  const { data: orders } = await service
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, governorate, shipping_address, total_amount, shipping_fee, status, created_at"
    )
    .order("created_at", { ascending: false });

  const totalOrders = orders?.length ?? 0;
  const pendingCount = orders?.filter((o: any) => o.status === "pending").length ?? 0;
  const deliveredCount = orders?.filter((o: any) => o.status === "delivered").length ?? 0;
  const totalRevenue = orders?.reduce(
    (sum: number, o: any) => sum + Number(o.total_amount || 0),
    0
  ) ?? 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* ✅ شريط التنقل */}
      <AdminNav
        adminName={profile.full_name || "المدير"}
        role={profile.role}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              إدارة الطلبات والمرتجعات
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              الدفع عند الاستلام — تحويل الحالة إلى «ملغي» أو «مرتجع» يُعيد القطع للمخزون تلقائياً
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportOrdersButton />
            <ExportOrdersButton statusFilter="pending" label="تصدير قيد المراجعة" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">إجمالي الطلبات</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalOrders}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">قيد المراجعة</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-orange-600">{pendingCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">تم التوصيل</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600">{deliveredCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">إجمالي الإيرادات</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {totalRevenue.toLocaleString("ar-EG")}{" "}
              <span className="text-sm font-normal text-gray-500">ج.م</span>
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">جميع الطلبات</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-600 font-bold">
                  <th className="py-3.5 px-4">رقم الطلب</th>
                  <th className="py-3.5 px-4">العميل والهاتف</th>
                  <th className="py-3.5 px-4">المحافظة والعنوان</th>
                  <th className="py-3.5 px-4">الإجمالي</th>
                  <th className="py-3.5 px-4">تغيير الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(orders ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      لا توجد طلبات مسجلة حالياً.
                    </td>
                  </tr>
                ) : (
                  orders?.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-2"
                        >
                          <span>{order.order_number}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-sans">
                            التفاصيل
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {order.customer_phone}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-700 font-medium text-sm">
                          {order.governorate}
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {order.shipping_address}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        {Number(order.total_amount).toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="py-4 px-4">
                        <OrderStatusSelect
                          orderId={order.id}
                          currentStatus={order.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}