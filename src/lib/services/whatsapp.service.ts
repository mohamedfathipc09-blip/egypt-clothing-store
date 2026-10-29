"use server";

export interface FullOrderDetails {
  orderNumber: string;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  city: string;
  streetAddress: string;
  landmark?: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  items: Array<{
    title: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>;
}

export async function sendWhatsAppOrderNotification(orderDetails: FullOrderDetails) {
  const adminPhone = process.env.WHATSAPP_ADMIN_RECIPIENT_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // إذا لم يتم إعداد المفاتيح، لا تفعل شيئاً
  if (!adminPhone || !apiKey) {
    console.warn("⚠️ لم يتم إعداد إشعارات الواتساب.");
    return;
  }

  // تجهيز قائمة المنتجات
  let itemsText = "";
  orderDetails.items.forEach((item, index) => {
    itemsText += `${index + 1}. ${item.title} (مقاس: ${item.size} - لون: ${item.color}) \n`;
    itemsText += `   الكمية: ${item.quantity} × ${item.price} ج.م\n`;
  });

  // تجهيز الرسالة
  const message = `🛍️ *طلب جديد في المتجر!*\n\n` +
    `📦 *رقم الطلب:* ${orderDetails.orderNumber}\n` +
    `👤 *العميل:* ${orderDetails.customerName}\n` +
    `📱 *الموبايل:* ${orderDetails.customerPhone}\n\n` +
    `📍 *العنوان:*\n` +
    `المحافظة: ${orderDetails.governorate}\n` +
    `المدينة: ${orderDetails.city}\n` +
    `العنوان: ${orderDetails.streetAddress}\n` +
    `${orderDetails.landmark ? `علامة مميزة: ${orderDetails.landmark}\n` : ""}\n` +
    `🛒 *المنتجات:*\n${itemsText}\n` +
    `💵 *ملخص الحساب:*\n` +
    `المجموع الفرعي: ${orderDetails.subtotal} ج.م\n` +
    `الشحن: ${orderDetails.shippingFee} ج.م\n` +
    `الخصم: ${orderDetails.discountAmount > 0 ? `- ${orderDetails.discountAmount} ج.م` : "لا يوجد"}\n` +
    `*الإجمالي النهائي:* ${orderDetails.totalAmount} ج.م\n\n` +
    `🔗 *رابط لوحة التحكم:* ${appUrl}/admin/orders\n` +
    `🔍 *رابط التتبع للعميل:* ${appUrl}/track-order?order=${orderDetails.orderNumber}`;

  const encodedMessage = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodedMessage}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("❌ فشل إرسال إشعار الواتساب");
    } else {
      console.log("✅ تم إرسال إشعار الواتساب بنجاح");
    }
  } catch (error) {
    console.error("❌ خطأ في الاتصال بـ CallMeBot:", error);
  }
}