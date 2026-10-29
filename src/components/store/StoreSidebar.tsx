"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, ChevronLeft, Home, Shirt, Phone, Info, Sparkles } from "lucide-react";

export default function StoreSidebar({
  isOpen,
  onClose,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[320px] bg-white z-[101] shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            تصفح المتجر
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            <Link href="/" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 hover:text-amber-600 text-gray-700 font-bold transition-colors">
              <Home className="w-5 h-5" />
              <span>الرئيسية</span>
            </Link>
            <Link href="/products" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 hover:text-amber-600 text-gray-700 font-bold transition-colors">
              <Shirt className="w-5 h-5" />
              <span>جميع المنتجات</span>
            </Link>
          </div>

          {categories.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
                تسوق حسب القسم
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 hover:text-amber-600 text-gray-700 font-medium transition-colors group"
                  >
                    <span>{cat.name}</span>
                    <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <Link href="/track-order" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 font-medium transition-colors">
              <Phone className="w-5 h-5" />
              <span>تتبع طلبك</span>
            </Link>
            <Link href="/policies/terms" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 font-medium transition-colors">
              <Info className="w-5 h-5" />
              <span>سياسات المتجر</span>
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">الدفع عند الاستلام متاح لجميع المحافظات</p>
        </div>
      </div>
    </>
  );
}