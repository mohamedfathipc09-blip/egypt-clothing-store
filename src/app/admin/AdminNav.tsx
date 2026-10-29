"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Warehouse,
  Ticket,
  Image as ImageIcon, // ✅ أيقونة البانرات
} from "lucide-react";
import { signOutAdminAction } from "@/app/admin/login/actions";

const navItems = [
  { href: "/admin/dashboard", label: "الرئيسية والإحصائيات", icon: LayoutDashboard },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/inventory", label: "المخزون", icon: Warehouse },
  { href: "/admin/banners", label: "البانرات", icon: ImageIcon }, // ✅ الزر الجديد
  { href: "/admin/orders", label: "الطلبات والمرتجعات", icon: ShoppingBag },
  { href: "/admin/coupons", label: "الكوبونات", icon: Ticket },
  { href: "/admin/settings", label: "الشحن", icon: Settings },
];

export default function AdminNav({
  adminName,
  role,
}: {
  adminName: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <header className="bg-gray-900 border-b border-gray-800 text-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-bold text-white"
          >
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span>لوحة الإدارة</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-300">
            {adminName} ({role})
          </span>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-xl transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>عرض المتجر</span>
          </Link>

          <form action={signOutAdminAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200 px-3 py-2 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </form>
        </div>
      </div>

      <div className="flex md:hidden border-t border-gray-800 px-4 py-2 gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "bg-amber-600 text-white"
                  : "text-gray-400 bg-gray-800/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}