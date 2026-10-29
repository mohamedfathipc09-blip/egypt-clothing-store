import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logoutCustomerAction } from "../auth-actions";
import { LayoutDashboard, ShoppingBag, MapPin, LogOut, User } from "lucide-react";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // جلب اسم العميل
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ترحيب */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            أهلاً بك، {profile?.full_name || "عميلنا العزيز"} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">إدارة طلباتك وعناوينك وبياناتك الشخصية</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* القائمة الجانبية */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm sticky top-24">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <User className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              
              <nav className="p-2 space-y-1">
                <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 text-gray-700 font-bold transition-colors">
                  <LayoutDashboard className="w-5 h-5" />
                  نظرة عامة
                </Link>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 text-gray-700 font-bold transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                  طلباتي
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 text-gray-700 font-bold transition-colors">
                  <MapPin className="w-5 h-5" />
                  عناويني
                </Link>
              </nav>

              <div className="p-2 border-t border-gray-100">
                <form action={logoutCustomerAction}>
                  <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-600 font-bold transition-colors">
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                </form>
              </div>
            </div>
          </aside>

          {/* محتوى الصفحة */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}