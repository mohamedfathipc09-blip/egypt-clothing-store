"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shirt,
  FolderTree,
  Boxes,
  ShoppingBag,
  Users,
  RotateCcw,
  Truck,
  Factory,
  Receipt,
  BarChart3,
  TicketPercent,
  MapPin,
  Settings,
  MessageSquareMore,
  ShieldAlert,
  LogOut,
  Image as ImageIcon, // ✅ تم إضافة أيقونة الصور هنا
} from "lucide-react";
import type { AdminRole } from "@/types/domain.types";
import { signOutAdminAction } from "@/app/admin/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: AdminRole[];
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "لوحة المؤشرات",
    icon: LayoutDashboard,
    allowedRoles: ["owner", "admin", "inventory_manager", "order_manager", "viewer"],
  },
  {
    href: "/admin/orders",
    label: "الطلبات",
    icon: ShoppingBag,
    allowedRoles: ["owner", "admin", "order_manager", "viewer"],
  },
  {
    href: "/admin/products",
    label: "المنتجات والمتغيرات",
    icon: Shirt,
    allowedRoles: ["owner", "admin", "inventory_manager", "viewer"],
  },
  {
    href: "/admin/categories",
    label: "الأقسام والتصنيفات",
    icon: FolderTree,
    allowedRoles: ["owner", "admin", "inventory_manager", "viewer"],
  },
  // ✅ تم إضافة البانرات هنا
  {
    href: "/admin/banners",
    label: "البانرات المتحركة",
    icon: ImageIcon,
    allowedRoles: ["owner", "admin"],
  },
  {
    href: "/admin/inventory",
    label: "إدارة المخزون والجرد",
    icon: Boxes,
    allowedRoles: ["owner", "admin", "inventory_manager", "viewer"],
  },
  {
    href: "/admin/returns",
    label: "المرتجعات والاستبدال",
    icon: RotateCcw,
    allowedRoles: ["owner", "admin", "order_manager", "viewer"],
  },
  {
    href: "/admin/customers",
    label: "العملاء",
    icon: Users,
    allowedRoles: ["owner", "admin", "order_manager", "viewer"],
  },
  {
    href: "/admin/purchases",
    label: "فواتير المشتريات",
    icon: Truck,
    allowedRoles: ["owner", "admin", "inventory_manager"],
  },
  {
    href: "/admin/suppliers",
    label: "الموردون",
    icon: Factory,
    allowedRoles: ["owner", "admin", "inventory_manager"],
  },
  {
    href: "/admin/expenses",
    label: "المصروفات التشغيلية",
    icon: Receipt,
    allowedRoles: ["owner", "admin"],
  },
  {
    href: "/admin/reports",
    label: "تقارير المبيعات والأرباح",
    icon: BarChart3,
    allowedRoles: ["owner", "admin", "viewer"],
  },
  {
    href: "/admin/coupons",
    label: "كوبونات الخصم",
    icon: TicketPercent,
    allowedRoles: ["owner", "admin"],
  },
  {
    href: "/admin/shipping",
    label: "المحافظات والشحن",
    icon: MapPin,
    allowedRoles: ["owner", "admin"],
  },
  {
    href: "/admin/whatsapp",
    label: "إشعارات واتساب",
    icon: MessageSquareMore,
    allowedRoles: ["owner", "admin", "order_manager"],
  },
  {
    href: "/admin/settings",
    label: "إعدادات المتجر والهوية",
    icon: Settings,
    allowedRoles: ["owner", "admin"],
  },
  {
    href: "/admin/audit-logs",
    label: "سجل التدقيق الأمني",
    icon: ShieldAlert,
    allowedRoles: ["owner", "admin"],
  },
];

export function AdminSidebar({
  adminName,
  role,
  roleLabelAr,
}: {
  adminName: string;
  role: AdminRole;
  roleLabelAr: string;
}) {
  const pathname = usePathname();
  const visibleItems = ADMIN_NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(role)
  );

  return (
    <aside className="w-72 bg-gray-900 text-gray-100 flex flex-col border-e border-gray-800 shrink-0 min-h-screen">
      <div className="p-5 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">إدارة المتجر</h2>
        <p className="text-xs text-gray-400 mt-1">{adminName}</p>
        <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {roleLabelAr}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <form action={signOutAdminAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>
    </aside>
  );
}