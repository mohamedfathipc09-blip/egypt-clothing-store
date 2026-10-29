import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import {
  updateShippingRateAction,
  toggleShippingZoneActiveAction,
} from "@/app/admin/actions";
import { Truck, Power, PowerOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
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
  const { data: shippingZones } = await service
    .from("shipping_zones")
    .select("*")
    .order("governorate_name_ar");

  const activeCount =
    shippingZones?.filter((z: any) => z.is_active).length ?? 0;
  const inactiveCount =
    (shippingZones?.length ?? 0) - activeCount;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <AdminNav
        adminName={profile.full_name || "المدير"}
        role={profile.role}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            إعدادات الشحن
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة تعريفة الشحن ومدة التوصيل لكل محافظة — يمكنك إيقاف الشحن
            لمحافظات معينة
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-gray-500 mb-1 font-medium">
              إجمالي المحافظات
            </p>
            <p className="text-lg font-extrabold text-gray-900">
              {shippingZones?.length ?? 0}
            </p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-emerald-600 mb-1 font-medium flex items-center gap-1">
              <Power className="w-3 h-3" /> مفعلة
            </p>
            <p className="text-lg font-extrabold text-emerald-600">
              {activeCount}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-gray-500 mb-1 font-medium flex items-center gap-1">
              <PowerOff className="w-3 h-3" /> معطلة
            </p>
            <p className="text-lg font-extrabold text-gray-500">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Shipping Zones */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              تعريفة الشحن حسب المحافظة
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              عدّل تكلفة الشحن والمدة، أو أوقف الشحن للمحافظة بالكامل
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(shippingZones ?? []).map((zone: any) => (
                <div
                  key={zone.id}
                  className={`rounded-xl border-2 transition-colors overflow-hidden ${
                    zone.is_active
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-200 opacity-80"
                  }`}
                >
                  {/* Header: name + status + toggle */}
                  <div className="p-3.5 flex items-center justify-between gap-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {zone.governorate_name_ar || zone.governorate}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 text-[10px] rounded-md font-bold ${
                          zone.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {zone.is_active ? "نشط" : "معطل"}
                      </span>
                    </div>

                    {/* زر التبديل السريع */}
                    <form
                      action={async () => {
                        "use server";
                        await toggleShippingZoneActiveAction(
                          zone.id,
                          !zone.is_active
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          zone.is_active
                            ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {zone.is_active ? (
                          <>
                            <PowerOff className="w-3 h-3" /> إيقاف
                          </>
                        ) : (
                          <>
                            <Power className="w-3 h-3" /> تشغيل
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Fees & Days form */}
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateShippingRateAction(formData);
                    }}
                    className="p-3.5 flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={zone.id} />

                    <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                      <span className="text-[10px] text-gray-500 font-medium">
                        الشحن:
                      </span>
                      <input
                        name="shipping_fee"
                        type="number"
                        defaultValue={
                          zone.customer_shipping_fee ?? zone.shipping_fee
                        }
                        className="w-20 rounded-lg bg-white border border-gray-300 px-2 py-1.5 text-center text-sm text-gray-900 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-gray-400">ج.م</span>
                    </div>

                    <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                      <span className="text-[10px] text-gray-500 font-medium">
                        المدة:
                      </span>
                      <input
                        name="estimated_days"
                        defaultValue={
                          zone.estimated_delivery_days || zone.estimated_days
                        }
                        className="w-24 rounded-lg bg-white border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors shadow-sm"
                    >
                      حفظ
                    </button>
                  </form>
                </div>
              ))}

              {(shippingZones ?? []).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    لا توجد محافظات مسجلة حالياً
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
            💡 معلومة
          </h3>
          <ul className="text-xs text-blue-800 space-y-1 leading-relaxed">
            <li>
              • المحافظات <strong>المعطلة</strong> لن تظهر للعميل في صفحة الدفع
              (لن يمكنه اختيارها).
            </li>
            <li>
              • يمكنك <strong>إيقاف الشحن مؤقتاً</strong> لمحافظة معينة دون حذف
              إعداداتها.
            </li>
            <li>
              • عند إعادة التفعيل، تعود الإعدادات كما كانت.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}