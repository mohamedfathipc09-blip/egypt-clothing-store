import { z } from "zod";

export const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;

export const cartItemInputSchema = z.object({
  variantId: z.string().uuid("معرف التركيبة غير صالح"),
  quantity: z
    .number()
    .int("الكمية يجب أن تكون رقماً صحيحاً")
    .min(1, "الكمية يجب ألا تقل عن قطعة واحدة")
    .max(50, "الحد الأقصى للقطعة الواحدة في الطلب هو 50"),
});

export const checkoutSubmissionSchema = z.object({
  idempotencyKey: z.string().min(10, "مفتاح عدم التكرار مفقود"),
  customerName: z
    .string()
    .trim()
    .min(3, "يرجى إدخال الاسم بالكامل (3 أحرف على الأقل)")
    .max(100, "الاسم طويل جداً"),
  customerPhone: z
    .string()
    .trim()
    .regex(
      egyptianPhoneRegex,
      "يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً (يبدأ بـ 010 أو 011 أو 012 أو 015)"
    ),
  shippingZoneId: z.string().uuid("يرجى اختيار المحافظة"),
  city: z
    .string()
    .trim()
    .min(2, "يرجى إدخال اسم المدينة أو المنطقة")
    .max(80, "اسم المنطقة طويل جداً"),
  streetAddress: z
    .string()
    .trim()
    .min(5, "يرجى كتابة العنوان بالتفصيل (اسم الشارع، رقم العقار، الدور)")
    .max(250, "العنوان طويل جداً"),
  landmark: z.string().trim().max(150).optional().or(z.literal("")),
  deliveryNotes: z.string().trim().max(300).optional().or(z.literal("")),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  acceptTerms: z.literal(true, {
    errorMap: () => ({
      message: "يجب الموافقة على شروط البيع وسياسة الخصوصية والاسترجاع لإتمام الطلب",
    }),
  }),
  items: z
    .array(cartItemInputSchema)
    .min(1, "سلة المشتريات فارغة، لا يمكن إتمام الطلب"),
});

export type CheckoutSubmissionInput = z.infer<typeof checkoutSubmissionSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(3, "يرجى إدخال رقم الطلب (مثال: EG-10001)"),
  verificationValue: z
    .string()
    .trim()
    .min(6, "يرجى إدخال رقم الهاتف المسجل بالطلب أو رمز التتبع"),
});