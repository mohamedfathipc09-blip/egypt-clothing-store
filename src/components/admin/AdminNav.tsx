"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Settings, ExternalLink,
  LogOut, ShieldCheck, Warehouse, Ticket, Image as ImageIcon, Users,
} from "lucide-react";
import { signOutAdminAction } from "@/app/admin/login/actions";

const ALL_NAV = [
  { href: "/admin/dashboard", label: "الرئيسية", icon: LayoutDashboard, roles: ["owner","admin","order_manager","inventory_manager","viewer"] },
  { href: "/admin/products", label: "المنتجات", icon: Package, roles: ["owner","admin","order_manager","inventory_manager","viewer"] },
  { href: "/admin/inventory", label: "المخزون", icon: Warehouse, roles: ["owner","admin","order_manager","inventory_manager","viewer"] },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag, roles: ["owner","admin","order_manager","inventory_manager","viewer"] },
  { href: "/admin/banners", label: "البانرات", icon: ImageIcon, roles: ["owner","admin"] },
  { href: "/admin/coupons", label: "الكوبونات", icon: Ticket, roles: ["owner","admin"] },
  { href: "/admin/admins", label: "المشرفين", icon: Users, roles: ["owner","admin"] },
  { href: "/admin/settings", label: "الشحن", icon: Settings, roles: ["owner","admin"] },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك",
  admin: "مدير عام",
  order_manager: "مدير طلبات",
  inventory_manager: "مدير مخزون",
  viewer: "مشاهد",
};

export default function AdminNav({
  adminName,
  role,
}: {
  adminName: string;
  role: string;
}) {
  const pathname = usePathname();
  const navItems = ALL_NAV.filter((item) => item.roles.includes(role));

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-gray-900 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-extrabold hidden sm:block">لوحة الإدارة</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-[10px]">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-700 font-medium">{adminName}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{ROLE_LABELS[role] || role}</span>
          </span>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">المتجر</span>
          </Link>

          <form action={signOutAdminAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-700 hover:text-rose-600 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </form>
        </div>
      </div>

      <div className="flex md:hidden border-t border-gray-100 px-4 py-2 gap-1 overflow-x-auto bg-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? "bg-amber-50 text-amber-700" : "text-gray-500 hover:bg-gray-50"
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