"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { formatEGP } from "@/lib/utils/currency";
import { getSecureOrderTrackingAction } from "@/lib/services/checkout.service";
import type { OrderTrackingDetails } from "@/lib/services/checkout.service";
import Link from "next/link";

export default function TrackOrderClient() {
  const searchParams = useSearchParams();
  const urlOrder = searchParams.get("order") || "";
  const urlToken = searchParams.get("token") || "";

  const [orderNumber, setOrderNumber] = useState(urlOrder);
  const [verifyValue, setVerifyValue] = useState(urlToken);

  const [order, setOrder] = useState<OrderTrackingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [autoSearchDone, setAutoSearchDone] = useState(false);

  // ✅ طباعة تشخيصية مهمة
  useEffect(() => {
    console.log("🎯 === URL PARAMS ===");
    console.log("🎯 order:", JSON.stringify(urlOrder));
    console.log("🎯 token:", JSON.stringify(urlToken));
    console.log("🎯 token length:", urlToken.length);
    console.log("🎯 Full URL:", window.location.href);
  }, [urlOrder, urlToken]);

  const performSearch = useCallback(async (ord: string, ver: string) => {
    if (!ord.trim() || !ver.trim()) return;

    console.log("🚀 Performing search with:");
    console.log("🚀 order:", JSON.stringify(ord));
    console.log("🚀 verification:", JSON.stringify(ver));
    console.log("🚀 verification length:", ver.length);

    setIsLoading(true);
    setError(null);
    setOrder(null);
    setHasSearched(true);

    try {
      const res = await getSecureOrderTrackingAction({
        orderNumber: ord.trim(),
        verificationValue: ver.trim(),
      });

      setIsLoading(false);

      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.error || "تعذر العثور على الطلب.");
      }
    } catch (e) {
      setIsLoading(false);
      setError((e as Error).message);
    }
  }, []);

  // البحث التلقائي من URL
  useEffect(() => {
    if (autoSearchDone) return;
    if (!urlOrder || !urlToken) return;
    setAutoSearchDone(true);
    void performSearch(urlOrder, urlToken);
  }, [urlOrder, urlToken, autoSearchDone, performSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void performSearch(orderNumber, verifyValue);
  }

  const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "قيد المراجعة", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <Clock className="w-5 h-5" /> },
    confirmed: { label: "تم التأكيد", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <CheckCircle2 className="w-5 h-5" /> },
    processing: { label: "قيد التجهيز", color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: <Package className="w-5 h-5" /> },
    shipped: { label: "تم الشحن", color: "text-purple-600 bg-purple-50 border-purple-200", icon: <Truck className="w-5 h-5" /> },
    delivered: { label: "تم التوصيل", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-5 h-5" /> },
    cancelled: { label: "ملغي", color: "text-rose-600 bg-rose-50 border-rose-200", icon: <XCircle className="w-5 h-5" /> },
    returned: { label: "مرتجع", color: "text-gray-600 bg-gray-50 border-gray-200", icon: <XCircle className="w-5 h-5" /> },
  };

  const defaultStatus = {
    label: "قيد المراجعة",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-5 h-5" />,
  };
  const currentStatus = order ? (statusMap[order.status] || defaultStatus) : defaultStatus;

  const timelineSteps = [
    { key: "pending", label: "تم الطلب", icon: <CheckCircle2 className="w-5 h-5" /> },
    { key: "confirmed", label: "تم التأكيد", icon: <Phone className="w-5 h-5" /> },
    { key: "shipped", label: "في الطريق إليك", icon: <Truck className="w-5 h-5" /> },
    { key: "delivered", label: "تم التوصيل", icon: <ShoppingBag className="w-5 h-5" /> },
  ];

  function getStepStatus(stepKey: string) {
    if (!order) return "upcoming";
    const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (order.status === "cancelled" || order.status === "returned") {
      return stepKey === "pending" ? "completed" : "cancelled";
    }
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "current";
    return "upcoming";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">تتبع طلبك</h1>
          <p className="text-sm text-gray-500 mt-2">
            أدخل رقم الطلب ورقم الهاتف (أو رمز التتبع) لمعرفة حالة الشحن.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">رقم الطلب *</label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="EG-12345"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              رقم الهاتف أو رمز التتبع *
            </label>
            <input
              type="text"
              required
              value={verifyValue}
              onChange={(e) => setVerifyValue(e.target.value)}
              placeholder="01012345678 أو Token"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span>{isLoading ? "جاري البحث..." : "بحث عن الطلب"}</span>
            </button>
          </div>
        </form>
      </div>

      {hasSearched && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {order && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`rounded-2xl border p-6 shadow-sm flex items-center justify-between ${currentStatus.color}`}>
            <div>
              <p className="text-xs opacity-80 mb-1">حالة الطلب رقم {order.orderNumber}</p>
              <h2 className="text-xl font-extrabold">{currentStatus.label}</h2>
            </div>
            <div className="p-3 bg-white/50 rounded-full">{currentStatus.icon}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-5 right-[10%] left-[10%] h-1 bg-gray-100 -z-10 rounded-full"></div>

              {timelineSteps.map((step) => {
                const status = getStepStatus(step.key);
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 w-1/4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        status === "completed"
                          ? "bg-emerald-500 text-white"
                          : status === "current"
                          ? "bg-amber-500 text-white ring-4 ring-amber-100"
                          : status === "cancelled"
                          ? "bg-rose-100 text-rose-400"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-bold text-center ${
                        status === "completed" || status === "current"
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm">تفاصيل الطلب</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      المقاس: {item.sizeName} | اللون: {item.colorName} | الكمية: {item.quantity}
                    </p>
                  </div>
                  <p className="font-extrabold text-gray-900 text-sm">{formatEGP(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
              <span className="font-bold text-gray-900">الإجمالي (الدفع عند الاستلام)</span>
              <span className="text-lg font-extrabold text-amber-600">
                {formatEGP(order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-4 shadow-sm">
            <MapPin className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-1">عنوان التوصيل</p>
              <p className="font-bold text-gray-900 text-sm">
                {order.governorate} - {order.city}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasSearched && !isLoading && (
        <div className="text-center pt-8">
          <p className="text-sm text-gray-500">
            هل تواجه مشكلة؟{" "}
            <Link href="/" className="text-amber-600 font-bold hover:underline">
              تواصل معنا
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}