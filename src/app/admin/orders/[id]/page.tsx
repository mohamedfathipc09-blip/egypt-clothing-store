import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import OrderStatusSelect from "../OrderStatusSelect";
import PrintInvoiceButton from "./PrintInvoiceButton";
import { ArrowRight, MapPin, Phone, User, Package, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
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

  const [{ data: order }, { data: items }, { data: history }] = await Promise.all([
    service.from("orders").select("*").eq("id", params.id).single(),
    service
      .from("order_items")
      .select("*")
      .eq("order_id", params.id)
      .order("created_at", { ascending: true }),
    service
      .from("order_status_history")
      .select("*")
      .eq("order_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-gray-100 print:bg-white print:text-black">
      <div className="print:hidden">
        <AdminNav adminName={profile.full_name} role={profile.role} />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* شريط علوي وأزرار التحكم */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-5 print:border-b print:border-gray-300 print:bg-white print:rounded-none">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 print:hidden"
              title="العودة للطلبات"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-white print:text-black flex items-center gap-2">
                <span>بوليصة وتفاصيل الطلب</span>
                <span className="font-mono text-amber-400 print:text-black">
                  #{order.order_number}
                </span>
              </h1>
              <p className="text-xs text-gray-400 print:text-gray-600">
                تاريخ الطلب: {new Date(order.created_at).toLocaleString("ar-EG")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="print:hidden">
              <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
            </div>
            <PrintInvoiceButton />
          </div>
        </div>

        {/* بيانات العميل والشحن */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3 print:bg-white print:border-gray-300">
            <h2 className="text-base font-bold text-amber-400 print:text-black flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>بيانات العميل والمستلم</span>
            </h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-gray-400 print:text-gray-600">الاسم: </span>
                <span className="font-bold text-white print:text-black">{order.customer_name}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400 print:text-gray-600">الهاتف الأساسي: </span>
                <span className="font-mono font-bold text-white print:text-black">
                  {order.customer_phone}
                </span>
              </p>
              {order.customer_alt_phone && (
                <p>
                  <span className="text-gray-400 print:text-gray-600">هاتف بديل: </span>
                  <span className="font-mono text-white print:text-black">
                    {order.customer_alt_phone}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3 print:bg-white print:border-gray-300">
            <h2 className="text-base font-bold text-amber-400 print:text-black flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>عنوان التوصيل وطريقة الدفع</span>
            </h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-gray-400 print:text-gray-600">المحافظة: </span>
                <span className="font-bold text-white print:text-black">{order.governorate}</span>
              </p>
              <p>
                <span className="text-gray-400 print:text-gray-600">العنوان بالتفصيل: </span>
                <span className="font-medium text-white print:text-black">
                  {order.shipping_address}
                </span>
              </p>
              {order.notes && (
                <p>
                  <span className="text-gray-400 print:text-gray-600">ملاحظات العميل: </span>
                  <span className="text-amber-300 print:text-black">{order.notes}</span>
                </p>
              )}
              <p className="pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold print:border-black print:text-black">
                  الدفع نقداً عند الاستلام (COD)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* جدول القطع المطلوبة للتجهيز */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 print:bg-white print:border-gray-300">
          <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>القطع المطلوبة للتجهيز والشحن</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-gray-400 border-b border-gray-800 print:text-black print:border-gray-300">
                <tr>
                  <th className="py-3 px-2">المنتج</th>
                  <th className="py-3 px-2">المقاس واللون</th>
                  <th className="py-3 px-2">كود المخزن (SKU)</th>
                  <th className="py-3 px-2">سعر الوحدة</th>
                  <th className="py-3 px-2">الكمية</th>
                  <th className="py-3 px-2">الإجمالي الفرعي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 print:divide-gray-300">
                {(items ?? []).map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-3 px-2 font-bold text-white print:text-black">
                      {item.product_title_snapshot}
                    </td>
                    <td className="py-3 px-2 text-gray-300 print:text-black">
                      مقاس: <strong className="text-amber-400 print:text-black">{item.size_snapshot}</strong> | لون:{" "}
                      <strong>{item.color_snapshot}</strong>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs text-gray-400 print:text-black">
                      {item.sku_snapshot}
                    </td>
                    <td className="py-3 px-2">
                      {Number(item.unit_price).toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="py-3 px-2 font-extrabold text-base text-white print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-2 font-bold text-white print:text-black">
                      {Number(item.line_total).toLocaleString("ar-EG")} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ملخص الحساب والتحصيل */}
          <div className="border-t border-gray-800 pt-4 flex flex-col items-end space-y-1.5 text-sm print:border-gray-300">
            <div className="flex justify-between w-full max-w-xs text-gray-400 print:text-black">
              <span>المجموع الفرعي:</span>
              <span>{Number(order.subtotal_amount).toLocaleString("ar-EG")} ج.م</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between w-full max-w-xs text-emerald-400 print:text-black">
                <span>قيمة الخصم {order.coupon_code ? `(${order.coupon_code})` : ""}:</span>
                <span>- {Number(order.discount_amount).toLocaleString("ar-EG")} ج.م</span>
              </div>
            )}
            <div className="flex justify-between w-full max-w-xs text-gray-400 print:text-black">
              <span>مصاريف الشحن ({order.governorate}):</span>
              <span>{Number(order.shipping_fee).toLocaleString("ar-EG")} ج.م</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-lg font-extrabold text-amber-400 border-t border-gray-800 pt-2 print:text-black print:border-gray-400">
              <span>المطلوب تحصيله عند الاستلام:</span>
              <span>{Number(order.total_amount).toLocaleString("ar-EG")} ج.م</span>
            </div>
          </div>
        </div>

        {/* سجل تتبع حالات الطلب (يختفي عند الطباعة) */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 print:hidden">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>سجل تغييرات حالة الطلب</span>
          </h2>
          <div className="space-y-2">
            {(history ?? []).map((h: any) => (
              <div
                key={h.id}
                className="flex items-center justify-between text-xs bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5"
              >
                <div>
                  <span className="font-bold text-amber-400">{h.new_status}</span>
                  {h.note && <span className="text-gray-400 ms-2">— {h.note}</span>}
                </div>
                <span className="text-gray-500">
                  {new Date(h.created_at).toLocaleString("ar-EG")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}