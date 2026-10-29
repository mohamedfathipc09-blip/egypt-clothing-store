import React from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatEGP } from "@/lib/utils/currency";
import { getOrderStatusLabelAr } from "@/lib/utils/order-status";
import { Package, MapPin, ChevronLeft, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // جلب آخر 3 طلبات
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, created_at")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // جلب عدد العناوين
  const { count: addressesCount } = await supabase
    .from("customer_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id);

  return (
    <div className="space-y-6">
      
      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">إجمالي الطلبات</p>
            <p className="text-2xl font-black text-gray-900">{recentOrders?.length || 0}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">عناوين التوصيل المحفوظة</p>
            <p className="text-2xl font-black text-gray-900">{addressesCount || 0}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* أحدث الطلبات */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> أحدث طلباتك
          </h2>
          <Link href="/account/orders" className="text-xs font-bold text-amber-600 hover:underline">
            عرض الكل
          </Link>
        </div>
        
        {!recentOrders || recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">لم تقم بأي طلب حتى الآن.</p>
            <Link href="/products" className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors">
              ابدأ التسوق
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <Link href={`/track-order?order=${order.order_number}`} key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-bold text-gray-900 text-sm font-mono">{order.order_number}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">
                    {getOrderStatusLabelAr(order.status)}
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm">{formatEGP(order.total_amount)}</span>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}