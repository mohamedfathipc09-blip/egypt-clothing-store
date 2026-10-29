import React from "react";
import type { Metadata } from "next";
import "./globals.css";

// NOTE: Google Font import removed due to sandbox network restrictions.
// If you want to use the Cairo font, add it as a local font in the `public/fonts` directory
// and import it with `next/font/local` as described in the documentation.

// ✅ السطر السحري اللي بيجبر المشروع كله يشتغل ديناميكياً (مش ثابت)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "متجر الملابس الإلكتروني",
  description:
    "تسوق أحدث الأزياء والملابس العصرية داخل جمهورية مصر العربية مع الدفع عند الاستلام.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans min-h-screen flex flex-col">{children}</body>
    </html>
  );
}