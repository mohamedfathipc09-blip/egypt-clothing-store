import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  PackageSearch,
  ShoppingBag,
  Copy,
  Truck,
  Phone,
  MapPin,
  CreditCard,
  Home,
  ShieldCheck,
} from "lucide-react";
import { getSecureOrderTrackingAction } from "@/lib/services/checkout.service";
import { formatEGP } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: { orderNumber: string };
  searchParams: { token?: string };
}) {
  const orderNumber = decodeURIComponent(params.orderNumber);
  const trackingToken = searchParams.token ?? "";

  // جلب تفاصيل الطلب إذا وُجد رمز التتبع (لضمان الأمان)
  let orderData = null;
  if (trackingToken) {
    const res = await getSecureOrderTrackingAction({
      orderNumber,
      verificationValue: trackingToken,
    });
    if (res.success && res.order) {
      orderData = res.order;
    }
  }

  const trackingUrl = `/track-order?order=${encodeURIComponent(
    orderNumber
  )}&token=${encodeURIComponent(trackingToken)}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        
        {/* 1. رسالة النجاح الرئيسية */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            تم استلام طلبك بنجاح!
          </h1>
          <p className="text-base text-gray-600">
            شكرًا لثقتك بنا، سنتصل بك قريبًا لتأكيد موعد التوصيل.
          </p>
        </div>

        {/* 2. رقم الطلب ورمز التتبع */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-2">رقم الطلب</p>
          <p className="text-3xl font-mono font-extrabold text-amber-600 tracking-wider mb-4">
            {orderNumber}
          </p>
          
          <div className="inline-flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
            <Copy className="w-3.5 h-3.5" />
            <span className="font-mono">رمز التتبع: {trackingToken.slice(0, 8)}...</span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              طريقة الدفع: <strong className="text-gray-900">الدفع نقدًا عند الاستلام (COD)</strong>
            </p>
          </div>
        </div>

        {/* 3. تفاصيل الطلب (إن توفرت البيانات) */}
        {orderData && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">تفاصيل طلبك</h2>
              <span className="text-xs text-gray-500">
                {new Date(orderData.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* المنتجات */}
            <div className="divide-y divide-gray-100">
              {orderData.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-6 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        المقاس: {item.sizeName} | اللون: {item.colorName} | الكمية: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-gray-900 text-sm">
                      {formatEGP(item.lineTotal)}
                    </p>
                    <p className="text-xs text-gray-400">
                      ({formatEGP(item.unitPrice)} × {item.quantity})
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* الإجماليات */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 space-y-2 text-sm border-t border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>إجمالي المنتجات</span>
                <span className="font-bold">{formatEGP(orderData.subtotalAmount)}</span>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>خصم</span>
                  <span>- {formatEGP(orderData.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>الشحن</span>
                <span className="font-bold">
                  {orderData.shippingFee === 0 ? "مجاني" : formatEGP(orderData.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                <span className="font-extrabold text-gray-900">الإجمالي المطلوب عند الاستلام</span>
                <span className="text-xl font-extrabold text-amber-600">
                  {formatEGP(orderData.totalAmount)}
                </span>
              </div>
            </div>

            {/* معلومات التوصيل */}
            <div className="p-4 sm:p-6 bg-white border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">عنوان التوصيل</p>
                  <p className="font-bold text-gray-900">
                    {orderData.governorate} - {orderData.city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">اسم العميل</p>
                  <p className="font-bold text-gray-900">{orderData.customerName}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ماذا يحدث الآن؟ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ماذا يحدث الآن؟
          </h2>
          <div className="space-y-4">
            <Step
              number={1}
              icon={<Phone className="w-4 h-4" />}
              title="تأكيد الطلب"
              description="سيتواصل معك فريقنا على رقم هاتفك خلال ساعات لتأكيد الطلب."
            />
            <Step
              number={2}
              icon={<Truck className="w-4 h-4" />}
              title="التجهيز والشحن"
              description="سنقوم بتجهيز طلبك وتسليمه لشركة الشحن خلال 1-2 يوم عمل."
            />
            <Step
              number={3}
              icon={<Home className="w-4 h-4" />}
              title="التوصيل"
              description="سيصلك الطلب خلال 2-4 أيام عمل، وتدفع نقدًا عند الاستلام."
              isLast
            />
          </div>
        </div>

        {/* 5. أزرار الإجراءات */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={trackingUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
          >
            <PackageSearch className="w-5 h-5" />
            <span>تتبع حالة الطلب</span>
          </Link>

          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>متابعة التسوق</span>
          </Link>
        </div>

        {/* 6. شعار شكر */}
        <p className="text-center text-xs text-gray-400 pt-4">
          شكرًا لاختيارك متجرنا 💛 — يسعدنا خدمتك دائمًا
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  description,
  isLast,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 relative">
      {!isLast && (
        <div className="absolute start-4 top-8 bottom-0 w-0.5 bg-gray-200" />
      )}
      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 relative z-10">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-amber-600">{icon}</span>
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}