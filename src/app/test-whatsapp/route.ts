import { NextResponse } from "next/server";
import { sendWhatsAppOrderNotification } from "@/lib/services/whatsapp.service";

export async function GET() {
  const adminPhone = process.env.WHATSAPP_ADMIN_RECIPIENT_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;

  // 1. فحص المتغيرات
  const diagnostics = {
    adminPhone: adminPhone || "❌ غير موجود",
    apiKeyPresent: apiKey ? `✅ موجود (${apiKey.slice(0, 4)}...)` : "❌ غير موجود",
    phoneFormatOK: adminPhone ? /^20\d{10}$/.test(adminPhone) : false,
  };

  // 2. محاولة الإرسال
  let sendResult = "لم يُحاول";
  if (adminPhone && apiKey) {
    try {
      await sendWhatsAppOrderNotification({
        orderNumber: "TEST-12345",
        customerName: "اختبار",
        totalAmount: 100,
        itemCount: 1,
      });
      sendResult = "✅ تم استدعاء الدالة (راجع الـ Terminal)";
    } catch (e) {
      sendResult = `❌ فشل: ${(e as Error).message}`;
    }
  }

  return NextResponse.json({
    ...diagnostics,
    sendResult,
    expectedPhoneFormat: "20XXXXXXXXXX (مثال: 201012345678)",
  });
}