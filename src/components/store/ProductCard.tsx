import React from "react";
import Link from "next/link";
import { ImageOff, ShoppingBag, ArrowLeft } from "lucide-react";
import { formatEGP } from "@/lib/utils/currency";
import type { CatalogProductSummary } from "@/lib/services/catalog.service";
import WishlistButton from "./WishlistButton"; // ✅ استيراد زر القلب

export function ProductCard({ product }: { product: CatalogProductSummary }) {
  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price > product.base_price;

  const discountPercentage =
    hasDiscount && product.compare_at_price
      ? Math.round(
          ((product.compare_at_price - product.base_price) /
            product.compare_at_price) *
            100
        )
      : 0;

  const isOutOfStock = product.total_available_qty <= 0;

  return (
    <article className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-amber-200 transition-all duration-300 h-full">
      
      {/* 1. منطقة الصورة */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[3/4] bg-gray-50 overflow-hidden block shrink-0"
      >
        {product.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primary_image_url}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
              isOutOfStock ? "opacity-60 grayscale-[50%]" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-100 text-gray-400">
            <ImageOff className="w-10 h-10 mb-2 opacity-40" />
            <span className="text-xs font-medium">لا توجد صورة</span>
          </div>
        )}

        {/* الشارات العلوية */}
        <div className="absolute top-3 start-3 flex flex-col gap-2 z-10">
          {hasDiscount && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black shadow-sm">
              خصم {discountPercentage}%
            </span>
          )}
          {product.is_featured && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-black shadow-sm">
              الأكثر مبيعاً 🔥
            </span>
          )}
        </div>

        {/* ✅ زر القلب الجديد (في الزاوية العلوية اليسرى) */}
        <div className="absolute top-3 end-3 z-10">
          <WishlistButton productId={product.id} />
        </div>

        {/* شارة نفد المخزون */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
            <span className="px-4 py-2 rounded-xl bg-white/95 text-gray-900 text-sm font-black shadow-lg">
              نفد من المخزون
            </span>
          </div>
        )}

        {/* زر سريع يظهر عند التمرير (Hover) */}
        <div className="absolute bottom-3 start-3 end-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 hidden sm:block">
          <span className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/90 backdrop-blur-md text-gray-900 text-sm font-bold shadow-sm hover:bg-white">
            عرض التفاصيل
          </span>
        </div>
      </Link>

      {/* 2. تفاصيل المنتج */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* القسم */}
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-[11px] font-bold text-gray-400 hover:text-amber-600 transition-colors mb-1"
          >
            {product.category.name}
          </Link>
        )}

        {/* اسم المنتج */}
        <Link href={`/products/${product.slug}`} className="block mb-2">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* السعر وزر الإضافة */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {hasDiscount && product.compare_at_price && (
              <span className="text-xs text-gray-400 line-through mb-0.5">
                {formatEGP(product.compare_at_price)}
              </span>
            )}
            <span className="text-lg font-black text-gray-900 leading-none">
              {formatEGP(product.base_price)}
            </span>
          </div>

          {/* زر الشراء الدائري */}
          <Link
            href={`/products/${product.slug}`}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
              isOutOfStock
                ? "bg-gray-100 text-gray-400 pointer-events-none"
                : "bg-gray-900 text-white hover:bg-amber-600 hover:scale-105 hover:shadow-amber-600/30"
            }`}
            aria-label={isOutOfStock ? "غير متوفر" : "تسوق الآن"}
          >
            {isOutOfStock ? <ArrowLeft className="w-5 h-5 opacity-50" /> : <ShoppingBag className="w-5 h-5" />}
          </Link>
        </div>
      </div>
    </article>
  );
}