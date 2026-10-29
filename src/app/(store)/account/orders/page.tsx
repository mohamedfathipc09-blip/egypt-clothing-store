import React from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatEGP } from "@/lib/utils/currency";
import { getOrderStatusLabelAr } from "@/lib/utils/order-status";
import { Package, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, created_at")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-extrabold text-gray-900">سجل الطلبات</h2>
        <p className="text-xs text-gray-500 mt-1">إجمالي {orders?.length || 0} طلب</p>
      </div>
      
      {!orders || orders.length === 0 ? (
        <div className="p-10 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">لا توجد طلبات سابقة.</p>
          <Link href="/products" className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors">
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {orders.map((order) => (
            <Link href={`/track-order?order=${order.order_number}`} key={order.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-bold text-gray-900 text-sm font-mono">{order.order_number}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString("ar-EG")}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-6">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg whitespace-nowrap">
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
  );
}