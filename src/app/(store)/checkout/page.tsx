"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Banknote,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatEGP } from "@/lib/utils/currency";
import {
  getActiveShippingZonesAction,
  validateCartOnServerAction,
  submitOrderServerAction,
  getDefaultAddressAction,
  type CartValidationSummary,
} from "@/lib/services/checkout.service";
import type { ShippingZone } from "@/types/domain.types";

const STORAGE_KEY = "eg_clothing_cart_v1";

function zoneName(z: any): string {
  return z?.governorate_name ?? z?.governorate ?? "";
}

function zoneDays(z: any): string {
  return z?.estimated_delivery_days ?? z?.estimated_days ?? "";
}

// ✅ التصدير الافتراضي الصحيح
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoupon = searchParams.get("coupon") ?? "";

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [cartItems, setCartItems] = useState<
    Array<{ variantId: string; quantity: number }>
  >([]);
  const [summary, setSummary] = useState<CartValidationSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingZoneId, setShippingZoneId] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [couponCode] = useState(initialCoupon);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshServerSummary = useCallback(
    async (
      items: Array<{ variantId: string; quantity: number }>,
      zoneId: string,
      coupon: string
    ) => {
      setIsLoadingSummary(true);
      try {
        const res = await validateCartOnServerAction({
          items,
          shippingZoneId: zoneId || undefined,
          couponCode: coupon || undefined,
        });
        setSummary(res);
      } finally {
        setIsLoadingSummary(false);
      }
    },
    []
  );

  useEffect(() => {
    setIdempotencyKey(`ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

    async function initCheckout() {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw
        ? (JSON.parse(raw) as Array<{ variantId: string; quantity: number }>)
        : [];

      if (parsed.length === 0) {
        router.replace("/cart");
        return;
      }

      setCartItems(parsed);
      const activeZones = await getActiveShippingZonesAction();
      setZones(activeZones);
      let defaultZoneId = activeZones[0]?.id ?? "";

      const userData = await getDefaultAddressAction();
      
      if (userData) {
        if (userData.fullName) setCustomerName(userData.fullName);
        if (userData.phone) setCustomerPhone(userData.phone);
        
        if (userData.address) {
          setCity(userData.address.city);
          setStreetAddress(userData.address.street_address);
          setLandmark(userData.address.landmark || "");
          
          const matchingZone = activeZones.find(
            (z: any) => zoneName(z) === userData.address.governorate
          );
          if (matchingZone) {
            defaultZoneId = matchingZone.id;
          }
        }
      }

      setShippingZoneId(defaultZoneId);
      await refreshServerSummary(parsed, defaultZoneId, initialCoupon);
    }

    void initCheckout();
  }, [router, initialCoupon, refreshServerSummary]);

  function handleZoneChange(newZoneId: string) {
    setShippingZoneId(newZoneId);
    void refreshServerSummary(cartItems, newZoneId, couponCode);
  }

  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!shippingZoneId) {
      setSubmitError("يرجى اختيار المحافظة.");
      return;
    }

    if (!acceptTerms) {
      setSubmitError(
        "يرجى الموافقة على شروط البيع وسياسة الخصوصية والاسترجاع لإتمام الطلب."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitOrderServerAction({
        idempotencyKey,
        customerName,
        customerPhone,
        shippingZoneId,
        city,
        streetAddress,
        landmark,
        deliveryNotes,
        couponCode,
        acceptTerms: true,
        items: cartItems,
      });

      console.log("🚀 Client received result:", result);

      if (!result.success || !result.orderNumber) {
        setSubmitError(result.error ?? "تعذر إنشاء الطلب، يرجى مراجعة البيانات.");
        setIsSubmitting(false);
        return;
      }

      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("cart-updated"));

      const redirectUrl = `/order-success/${encodeURIComponent(result.orderNumber)}?token=${encodeURIComponent(
        result.trackingToken ?? ""
      )}`;
      console.log("➡️ Redirecting to:", redirectUrl);

      router.replace(redirectUrl);
    } catch {
      setSubmitError("حدث خطأ في الاتصال بالخادم، لم يتم خصم أي مبالغ.");
      setIsSubmitting(false);
    }
  }

  const selectedZone: any = zones.find((z: any) => z.id === shippingZoneId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        إتمام الطلب والشحن
      </h1>
      <p className="text-sm text-gray-600 mb-8">
        لا تحتاج إلى إنشاء حساب — أدخل بيانات التوصيل وسيتم الدفع نقداً عند الاستلام.
      </p>

      {submitError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-sm font-bold"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      <form
        onSubmit={handleConfirmOrder}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        noValidate
      >
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              1. بيانات المستلم
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الاسم بالكامل <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: محمد أحمد علي"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  رقم الموبايل المصري (للتأكيد والتوصيل){" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-right focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              2. عنوان التوصيل داخل مصر
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  المحافظة <span className="text-red-600">*</span>
                </label>
                <select
                  value={shippingZoneId}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                >
                  {zones.length === 0 && (
                    <option value="">لا توجد محافظات متاحة حالياً</option>
                  )}
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {zoneName(z)} — شحن {formatEGP(z.customer_shipping_fee ?? z.shipping_fee ?? 0)}
                    </option>
                  ))}
                </select>
                {selectedZone && zoneDays(selectedZone) && (
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>مدة التوصيل المتوقعة: {zoneDays(selectedZone)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  المدينة أو المنطقة / الحي <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: مدينة نصر / سموحة / المعادي"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                العنوان بالتفصيل (الشارع، رقم العقار، الدور، الشقة){" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="مثال: 15 شارع عباس العقاد، عمارة 4، الدور الثالث، شقة 6"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  علامة مميزة للعنوان (اختياري)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="مثال: بجوار صيدلية العزبي"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  ملاحظات التوصيل للمندوب (اختياري)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              3. طريقة الدفع
            </h2>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50/70 border-2 border-amber-600">
              <Banknote className="w-6 h-6 text-amber-700 shrink-0" />
              <div>
                <p className="text-sm font-extrabold text-gray-900">
                  الدفع نقداً عند الاستلام (Cash on Delivery)
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  تدفع قيمة الطلب بالجنيه المصري لمندوب الشحن عند استلام القطع.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-5 sticky top-24">
            <h2 className="text-lg font-extrabold text-gray-900">مراجعة الطلب</h2>

            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {(summary?.items ?? []).map((item) => (
                <div key={item.variantId} className="py-3 flex justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{item.productName}</p>
                    <p className="text-gray-500">
                      المقاس: {item.sizeName} | اللون: {item.colorName} | الكمية:{" "}
                      {item.requestedQty}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">
                    {formatEGP(item.lineSubtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              {(summary?.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>الخصم ({summary?.couponAppliedCode})</span>
                  <span>- {formatEGP(summary?.discountAmount ?? 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-700">
                <span>تكلفة الشحن ({zoneName(selectedZone)})</span>
                <span className="font-bold">
                  {summary?.shippingFee === 0
                    ? "شحن مجاني"
                    : formatEGP(summary?.shippingFee ?? 0)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between items-baseline">
              <span className="text-base font-extrabold text-gray-900">
                الإجمالي المطلوب عند الاستلام
              </span>
              <span className="text-2xl font-extrabold text-brand-primary">
                {formatEGP(summary?.totalAmount ?? 0)}
              </span>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-gray-300"
              />
              <span>
                أوافق على{" "}
                <Link href="/policies/terms" target="_blank" className="text-brand-accent underline font-semibold">
                  شروط البيع
                </Link>{" "}
                و{" "}
                <Link href="/policies/returns" target="_blank" className="text-brand-accent underline font-semibold">
                  سياسة الاستبدال والاسترجاع
                </Link>{" "}
                و{" "}
                <Link href="/policies/privacy" target="_blank" className="text-brand-accent underline font-semibold">
                  سياسة الخصوصية
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingSummary ||
                !shippingZoneId ||
                Boolean(summary?.hasStockIssues)
              }
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-brand-primary hover:bg-amber-600 disabled:bg-gray-300 text-white font-extrabold text-sm transition shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تسجيل الطلب وحجز المخزون...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تأكيد الطلب (الدفع عند الاستلام)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>تأكيد فوري وحجز ذري للقطع من المخزن</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}