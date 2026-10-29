import React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

interface FooterProps {
  storeName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  addressText: string;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export function Footer({
  storeName,
  tagline,
  supportPhone,
  supportEmail,
  addressText,
  categories,
}: FooterProps) {
  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-bold text-white mb-3">{storeName}</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">{tagline}</p>
          <p className="text-xs text-amber-400 font-medium">
            جميع الأسعار بالجنيه المصري (ج.م) — متاح الدفع نقداً عند الاستلام.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white uppercase mb-4">الأقسام</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/products" className="hover:text-white transition-colors">
                جميع المنتجات
              </Link>
            </li>
            {categories.slice(0, 5).map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white uppercase mb-4">
            خدمة العملاء والسياسات
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/track-order" className="hover:text-white transition-colors">
                تتبع حالة الطلب
              </Link>
            </li>
            <li>
              <Link
                href="/policies/shipping"
                className="hover:text-white transition-colors"
              >
                سياسة الشحن والتوصيل
              </Link>
            </li>
            <li>
              <Link
                href="/policies/returns"
                className="hover:text-white transition-colors"
              >
                سياسة الاستبدال والاسترجاع
              </Link>
            </li>
            <li>
              <Link
                href="/policies/privacy"
                className="hover:text-white transition-colors"
              >
                سياسة الخصوصية
              </Link>
            </li>
            <li>
              <Link
                href="/policies/terms"
                className="hover:text-white transition-colors"
              >
                شروط الاستخدام والأسئلة الشائعة
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white uppercase mb-4">تواصل معنا</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span dir="ltr">{supportPhone}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{supportEmail}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
              <span>{addressText}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-900 py-5 text-center text-xs text-gray-500 px-4">
        جميع الحقوق محفوظة © {new Date().getFullYear()} {storeName} — جمهورية مصر العربية.
      </div>
    </footer>
  );
}