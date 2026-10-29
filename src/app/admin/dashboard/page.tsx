import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import { formatEGP } from "@/lib/utils/currency";
import {
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Warehouse,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
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

  const [
    { data: orders, error: ordersError },
    { count: productsCount },
    { data: lowStockItems },
  ] = await Promise.all([
    service
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, governorate, status, subtotal, subtotal_amount, shipping_fee, total_amount, total_cost, net_profit, created_at"
      )
      .order("created_at", { ascending: false }),
    service.from("products").select("id", { count: "exact", head: true }),
    service
      .from("inventory_balances")
      .select(
        "variant_id, available_qty, reorder_threshold, product_variants(id, sku, size, color, products(title))"
      )
      .lte("available_qty", 5)
      .order("available_qty", { ascending: true })
      .limit(5),
  ]);

  if (ordersError) {
    console.error("❌ Dashboard orders query failed:", ordersError.message);
  }

  const allOrders = orders ?? [];
  const totalOrdersCount = allOrders.length;
  const pendingOrdersCount = allOrders.filter((o: any) => o.status === "pending").length;

  const validOrders = allOrders.filter(
    (o: any) =>
      o.status === "delivered" || o.status === "confirmed" || o.status === "shipped"
  );

  const calcOrderMetrics = (order: any) => {
    const shipping = Number(order.shipping_fee ?? 0);
    const total = Number(order.total_amount ?? 0);
    const itemsSubtotal = Number(
      order.subtotal || order.subtotal_amount || Math.max(0, total - shipping)
    );
    const cost = Number(order.total_cost ?? 0);
    const profit =
      order.net_profit !== null &&
      order.net_profit !== undefined &&
      Number(order.net_profit) !== 0
        ? Number(order.net_profit)
        : itemsSubtotal - cost;

    return { itemsSubtotal, cost, profit, shipping, total };
  };

  const financialTotals = validOrders.reduce(
    (acc, order) => {
      const m = calcOrderMetrics(order);
      acc.sales += m.itemsSubtotal;
      acc.cost += m.cost;
      acc.profit += m.profit;
      return acc;
    },
    { sales: 0, cost: 0, profit: 0 }
  );

  const recentOrders = allOrders.slice(0, 6);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <AdminNav adminName={profile.full_name || "المدير"} role={profile.role} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              لوحة الإحصائيات
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              نظرة سريعة على أداء متجرك
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            عرض جميع الطلبات
          </Link>
        </div>

        {ordersError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm">
            <p className="font-bold mb-1">⚠️ تعذّر تحميل الطلبات</p>
            <p className="font-mono text-xs">{ordersError.message}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                مؤكد
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">صافي الأرباح</p>
            <p className="text-xl font-black text-emerald-700">
              {formatEGP(financialTotals.profit)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">بعد خصم التكلفة والشحن</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">إجمالي التكلفة</p>
            <p className="text-xl font-black text-rose-600">
              {formatEGP(financialTotals.cost)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">تكلفة البضاعة المباعة</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">مبيعات المنتجات</p>
            <p className="text-xl font-black text-gray-900">
              {formatEGP(financialTotals.sales)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">بدون الشحن</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">قيد المراجعة</p>
            <p className="text-xl font-black text-amber-600">{pendingOrdersCount}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              من إجمالي {totalOrdersCount} طلب
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">المنتجات المسجلة</p>
            <p className="text-xl font-black text-gray-900">{productsCount ?? 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">منتج في المتجر</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                أحدث الطلبات
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                إدارة الكل
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 font-bold">
                    <th className="py-3 px-4">رقم الطلب</th>
                    <th className="py-3 px-4">العميل</th>
                    <th className="py-3 px-4">سعر البيع</th>
                    <th className="py-3 px-4">الربح</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                        لا توجد طلبات بعد.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order: any) => {
                      const { itemsSubtotal, profit } = calcOrderMetrics(order);
                      const isReturned = order.status === "returned" || order.status === "cancelled";

                      return (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-mono font-bold text-amber-600 hover:underline"
                            >
                              {order.order_number}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-gray-900 text-sm">{order.customer_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{order.customer_phone}</p>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                            {formatEGP(itemsSubtotal)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold text-sm ${isReturned ? "text-gray-400 line-through" : "text-emerald-600"}`}>
                              {formatEGP(profit)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                                order.status === "delivered"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : order.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : order.status === "cancelled" || order.status === "returned"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-gray-50 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {order.status === "delivered" ? "تم التوصيل"
                               : order.status === "pending" ? "قيد المراجعة"
                               : order.status === "confirmed" ? "تم التأكيد"
                               : order.status === "processing" ? "قيد التجهيز"
                               : order.status === "shipped" ? "تم الشحن"
                               : order.status === "cancelled" ? "ملغي"
                               : order.status === "returned" ? "مرتجع"
                             : order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                تنبيهات المخزون
              </h2>
              <Link
                href="/admin/inventory"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                المخزون
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4 space-y-2">
              {!lowStockItems || lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <Warehouse className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-500">المخزون بحالة جيدة</p>
                </div>
              ) : (
                lowStockItems.map((item: any) => {
                  const variant = item.product_variants;
                  const productTitle = variant?.products?.title ?? "منتج";
                  const qty = item.available_qty ?? 0;

                  return (
                    <div
                      key={item.variant_id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 truncate">{productTitle}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                          {variant?.size} | {variant?.color}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-bold ${
                        qty === 0
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}>
                        {qty} قطعة
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}