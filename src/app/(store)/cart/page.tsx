"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  AlertTriangle,
  TicketPercent,
  Loader2,
  ShieldCheck,
  Truck,
  RefreshCw,
  CheckCircle2, // ✅ تم إضافة الأيقونة هنا
} from "lucide-react";
import { formatEGP } from "@/lib/utils/currency";
import {
  validateCartOnServerAction,
  type CartValidationSummary,
  type ValidatedCartItem,
} from "@/lib/services/checkout.service";

interface LocalCartItem {
  variantId: string;
  quantity: number;
}

const STORAGE_KEY = "eg_clothing_cart_v1";

export default function CartPage() {
  const [localItems, setLocalItems] = useState<LocalCartItem[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [summary, setSummary] = useState<CartValidationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncWithServer = useCallback(
    async (itemsToSync: LocalCartItem[], couponToCheck: string) => {
      setIsLoading(true);
      try {
        const res = await validateCartOnServerAction({
          items: itemsToSync,
          couponCode: couponToCheck || undefined,
        });
        setSummary(res);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw
        ? (JSON.parse(raw) as Array<{ variantId: string; quantity: number }>)
        : [];
      const clean = parsed.map((i) => ({
        variantId: i.variantId,
        quantity: Number(i.quantity) || 1,
      }));
      setLocalItems(clean);
      void syncWithServer(clean, "");
    } catch {
      setLocalItems([]);
      setIsLoading(false);
    }
  }, [syncWithServer]);

  function updateLocalStorage(updated: LocalCartItem[]) {
    setLocalItems(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
    void syncWithServer(updated, appliedCoupon);
  }

  function handleChangeQty(variantId: string, newQty: number, maxAvailable: number) {
    if (newQty < 1) return;
    const boundedQty = maxAvailable > 0 ? Math.min(newQty, maxAvailable) : newQty;
    const updated = localItems.map((item) =>
      item.variantId === variantId ? { ...item, quantity: boundedQty } : item
    );
    updateLocalStorage(updated);
  }

  function handleRemoveItem(variantId: string) {
    const updated = localItems.filter((item) => item.variantId !== variantId);
    updateLocalStorage(updated);
  }

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    setAppliedCoupon(code);
    void syncWithServer(localItems, code);
  }

  if (isLoading && !summary) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-3 text-gray-600">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-semibold">جاري التحقق من الأسعار وتوافر المخزون...</p>
      </div>
    );
  }

  const items: ValidatedCartItem[] = summary?.items ?? [];
  const subtotalAfterDiscount = Math.max(0, (summary?.subtotal ?? 0) - (summary?.discountAmount ?? 0));
  
  // ✅ إصلاح TypeScript: استخدام != null بدلاً من !== null
  const freeShippingThreshold = summary?.freeShippingThreshold ?? null;
  const isFreeShipping = freeShippingThreshold != null && subtotalAfterDiscount >= freeShippingThreshold;
  const amountRemainingForFreeShipping = freeShippingThreshold != null ? Math.max(0, freeShippingThreshold - subtotalAfterDiscount) : 0;
  const progressPercent = freeShippingThreshold != null 
    ? Math.min(100, (subtotalAfterDiscount / freeShippingThreshold) * 100) 
    : 0;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">سلة المشتريات فارغة</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          تصفح أحدث تشكيلات الملابس واختر المقاس واللون المناسبين لك. لدينا خصومات رائعة بانتظارك!
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
        >
          <span>تصفح المنتجات الآن</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50/50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-amber-600" />
        سلة المشتريات
        <span className="text-sm font-medium bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
          {items.length} قطعة
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          
          {freeShippingThreshold != null && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-sm font-bold">
                {isFreeShipping ? (
                  <span className="text-emerald-600 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    مبروك! لقد حصلت على شحن مجاني 🎉
                  </span>
                ) : (
                  <span className="text-gray-700 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-500" />
                    أضف <span className="text-rose-600 mx-1">{formatEGP(amountRemainingForFreeShipping)}</span> أخرى لتحصل على شحن مجاني!
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${isFreeShipping ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {summary?.hasStockIssues && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>يرجى تعديل الكميات أو حذف العناصر غير المتوفرة في السلة قبل المتابعة.</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {items.map((item: ValidatedCartItem) => (
              <div
                key={item.variantId}
                className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  item.isAvailable ? "hover:bg-gray-50/50" : "bg-rose-50/30"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <Link
                    href={item.productSlug ? `/products/${item.productSlug}` : "#"}
                    className="text-base font-bold text-gray-900 hover:text-amber-600 transition-colors block"
                  >
                    {item.productName}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">المقاس: <strong className="text-gray-900">{item.sizeName}</strong></span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md">اللون: <strong className="text-gray-900">{item.colorName}</strong></span>
                    <span className="font-mono text-gray-400 ms-2">SKU: {item.sku}</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-900 pt-2">
                    {formatEGP(item.unitSellingPrice)}
                  </p>
                  {item.stockWarning && (
                    <p className="text-xs font-bold text-rose-600 pt-1">{item.stockWarning}</p>
                  )}
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-gray-100">
                  <div className="inline-flex items-center border border-gray-200 rounded-xl bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleChangeQty(item.variantId, item.requestedQty - 1, item.availableQty)}
                      disabled={item.requestedQty <= 1 || isLoading}
                      className="p-2.5 text-gray-600 hover:text-rose-600 disabled:opacity-40 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-bold text-gray-900">{item.requestedQty}</span>
                    <button
                      type="button"
                      onClick={() => handleChangeQty(item.variantId, item.requestedQty + 1, item.availableQty)}
                      disabled={!item.isAvailable || item.requestedQty >= item.availableQty || isLoading}
                      className="p-2.5 text-gray-600 hover:text-emerald-600 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-left min-w-[80px]">
                    <span className="block text-lg font-extrabold text-amber-600">
                      {formatEGP(item.lineSubtotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.variantId)}
                    className="p-2.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="حذف من السلة"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5 pb-4 border-b border-gray-100">
              ملخص الطلب
            </h2>

            <form onSubmit={handleApplyCoupon} className="space-y-3 mb-6">
              <label className=" text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <TicketPercent className="w-4 h-4 text-amber-500" />
                هل لديك كود خصم؟
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="أدخل الكود"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm uppercase focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  تطبيق
                </button>
              </div>
              {summary?.couponError && (
                <p className="text-xs font-semibold text-rose-600">{summary.couponError}</p>
              )}
              {summary?.couponAppliedCode && (
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم تفعيل ({summary.couponAppliedCode}) بنجاح</span>
                </p>
              )}
            </form>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <span>إجمالي المنتجات</span>
                <span className="font-bold">{formatEGP(summary?.subtotal ?? 0)}</span>
              </div>

              {(summary?.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>قيمة الخصم</span>
                  <span>- {formatEGP(summary?.discountAmount ?? 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>تكلفة الشحن</span>
                <span>تُحسب في الخطوة التالية</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-extrabold text-gray-900">الصافي قبل الشحن</span>
                <span className="text-2xl font-extrabold text-amber-600">
                  {formatEGP(subtotalAfterDiscount)}
                </span>
              </div>
            </div>

            <Link
              href={summary?.hasStockIssues ? "#" : `/checkout${summary?.couponAppliedCode ? `?coupon=${encodeURIComponent(summary.couponAppliedCode)}` : ""}`}
              aria-disabled={summary?.hasStockIssues}
              className={`w-full flex items-center justify-center gap-2 py-4 px-5 rounded-xl text-sm font-extrabold text-white transition-all duration-300 ${
                summary?.hasStockIssues
                  ? "bg-gray-300 text-gray-500 pointer-events-none"
                  : "bg-gray-900 hover:bg-amber-600 shadow-lg shadow-gray-900/20 hover:shadow-amber-600/30 transform hover:-translate-y-0.5"
              }`}
            >
              <span>المتابعة للدفع</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500"/> دفع آمن</span>
              <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 text-blue-500"/> استبدال مجاني</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}