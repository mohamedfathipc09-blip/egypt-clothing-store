import { cookies } from "next/headers";
import LoginForm from "./LoginForm";

// ✅ إجبار الصفحة على أن تكون ديناميكية
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  // ✅ قراءة الكوكيز بتجبر Next.js إنه ميعملش Prerender للصفحة دي
  cookies();

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 flex flex-col justify-center items-center px-4 py-12 text-gray-100">
      <LoginForm />
    </div>
  );
}