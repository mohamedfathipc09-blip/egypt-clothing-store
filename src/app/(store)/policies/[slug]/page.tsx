import React from "react";
import { notFound } from "next/navigation";
import { getStoreSettings } from "@/lib/services/catalog.service";

export const dynamic = "force-dynamic";
const POLICY_TITLES: Record<
  string,
  { title: string; key: string; defaultText: string }
> = {
  privacy: {
    title: "سياسة الخصوصية وحماية البيانات",
    key: "privacy_policy",
    defaultText:
      "نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية (الاسم، رقم الهاتف، والعنوان) واستخدامها حصرياً لتجهيز وتوصيل طلباتك وخدمة ما بعد البيع داخل جمهورية مصر العربية.",
  },
  shipping: {
    title: "سياسة الشحن والتوصيل",
    key: "shipping_policy",
    defaultText:
      "يتم الشحن لجميع محافظات جمهورية مصر العربية خلال 2 إلى 5 أيام عمل، وتظهر تكلفة الشحن بوضوح قبل تأكيد الطلب مع إمكانية الدفع نقداً عند الاستلام.",
  },
  returns: {
    title: "سياسة الاستبدال والاسترجاع",
    key: "return_policy",
    defaultText:
      "يحق للعميل طلب الاستبدال أو الاسترجاع خلال المهلة المحددة من تاريخ الاستلام بشرط أن تكون القطعة بحالتها الأصلية وغير مستخدمة وبكامل بطاقاتها.",
  },
  terms: {
    title: "شروط الاستخدام والأسئلة الشائعة",
    key: "terms_of_use",
    defaultText:
      "جميع الأسعار المعروضة بالجنيه المصري (EGP). يتم حجز القطع من المخزون فور تأكيد الطلب، وتخضع جميع الطلبات للمراجعة والتأكيد الهاتفي.",
  },
};

export default async function PolicyPage({
  params,
}: {
  params: { slug: string };
}) {
  const meta = POLICY_TITLES[params.slug];
  if (!meta) {
    notFound();
  }

  const settings = await getStoreSettings();
  const customText = settings.policies[meta.key];
  const contentText =
    typeof customText === "string" && customText.trim() !== ""
      ? customText
      : meta.defaultText;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {meta.title}
        </h1>
        <p className="text-xs text-gray-500 mt-1">{settings.store_name}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {contentText}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-xs text-gray-700 space-y-2">
        <p className="font-bold text-gray-900">بيانات التواصل وخدمة العملاء:</p>
        <p>الهاتف: {settings.support_phone}</p>
        <p>البريد الإلكتروني: {settings.support_email}</p>
        <p>العنوان: {settings.address_text}</p>
      </div>
    </div>
  );
}