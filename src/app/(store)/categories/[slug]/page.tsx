import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFilteredCatalogProducts,
  getPublishedCategories,
} from "@/lib/services/catalog.service";
import { ProductCard } from "@/components/store/ProductCard";
import { PackageX, ChevronLeft, Home } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const categories = await getPublishedCategories();
  const category = categories.find((c) => c.slug === decodeURIComponent(params.slug));

  return {
    title: category ? `${category.name} | متجر الملابس` : "القسم غير موجود",
    description: `تصفح جميع المنتجات في قسم ${category?.name || ""} بأفضل الأسعار مع الدفع عند الاستلام.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const categorySlug = decodeURIComponent(params.slug);

  const [categories, catalogData] = await Promise.all([
    getPublishedCategories(),
    getFilteredCatalogProducts({ categorySlug, pageSize: 20 }),
  ]);

  const currentCategory = categories.find((c) => c.slug === categorySlug);

  if (!currentCategory) {
    notFound();
  }

  const { products } = catalogData;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 1. بانر القسم */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* مسار التنقل */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              الرئيسية
            </Link>
            <ChevronLeft className="w-3 h-3" />
            <Link href="/products" className="hover:text-amber-400 transition-colors">
              المنتجات
            </Link>
            <ChevronLeft className="w-3 h-3" />
            <span className="text-white font-bold">{currentCategory.name}</span>
          </nav>

          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3">
            {currentCategory.name}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            {products.length} منتج متاح في هذا القسم — اكتشف تشكيلتنا المميزة
          </p>
        </div>
      </div>

      {/* 2. قائمة المنتجات */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageX className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              لا توجد منتجات في هذا القسم حالياً
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              نعمل على إضافة منتجات جديدة قريباً. تصفح باقي الأقسام الآن!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
            >
              تصفح كل المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* 3. الأقسام الأخرى (للتشجيع على الاستكشاف) */}
      {categories.filter((c) => c.slug !== categorySlug).length > 0 && (
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block"></span>
                اكتشف أقسام أخرى
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories
                .filter((c) => c.slug !== categorySlug)
                .slice(0, 6)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group relative p-5 rounded-2xl border border-gray-200 bg-white hover:border-amber-500 hover:shadow-md transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[100px] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}