import type { OrderStatus, PaymentStatus } from "@/types/domain.types";

export function getOrderStatusLabelAr(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending_confirmation: "بانتظار تأكيد الطلب",
    confirmed: "تم تأكيد الطلب",
    processing: "جاري التجهيز والتغليف",
    ready_to_ship: "جاهز للتسليم لشركة الشحن",
    shipped: "خرج للشحن والتوصيل",
    delivered: "تم التسليم بنجاح",
    cancelled: "ملغي",
    return_requested: "طُلب استرجاع / استبدال",
    returned: "مرتجع مكتمل",
    failed_delivery: "تعذر التوصيل",
  };
  return labels[status] ?? status;
}

export function getPaymentStatusLabelAr(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    uncollected: "الدفع عند الاستلام (غير محصل بعد)",
    collected: "تم التحصيل",
    refunded: "تم رد المبلغ",
    cancelled: "ملغي",
  };
  return labels[status] ?? status;
}