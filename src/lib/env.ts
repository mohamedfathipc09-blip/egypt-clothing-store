import { z } from "zod";

/**
 * متغيرات البيئة العامة المسموح بوصولها إلى المتصفح
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url({
    message: "NEXT_PUBLIC_APP_URL يجب أن يكون رابطاً صحيحاً",
  }),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL غير صالح أو مفقود",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY مفقود",
  }),
});

/**
 * متغيرات البيئة السرية الخاصة بالخادم فقط
 */
const serverEnvSchema = publicEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, {
    message: "SUPABASE_SERVICE_ROLE_KEY مطلوب على الخادم للعمليات الإدارية الذرية",
  }),
  WHATSAPP_API_VERSION: z.string().default("v20.0"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_ADMIN_RECIPIENT_PHONE: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("خطأ أمني: لا يمكن استدعاء getServerEnv داخل المتصفح!");
  }
  return serverEnvSchema.parse(process.env);
}

/**
 * فحص صريح لما إذا كان تكامل واتساب مهيأ بالكامل أم في وضع الانتظار
 */
export function isWhatsAppConfigured(): boolean {
  if (typeof window !== "undefined") return false;
  const env = process.env;
  return Boolean(
    env.WHATSAPP_PHONE_NUMBER_ID &&
      env.WHATSAPP_ACCESS_TOKEN &&
      env.WHATSAPP_ADMIN_RECIPIENT_PHONE
  );
}