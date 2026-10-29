import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

export function createServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "خرق أمني حرج: يمنع منعاً باتاً استدعاء createServiceRoleClient داخل المتصفح!"
    );
  }

  const env = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}