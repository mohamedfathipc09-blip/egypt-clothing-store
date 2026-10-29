import React from "react";
import Link from "next/link";
import { getFilteredCatalogProducts, getPublishedCategories } from "@/lib/services/catalog.service";
import { ProductCard } from "@/components/store/ProductCard";
import { PackageX, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = decodeURIComponent(params.slug);
  
  const [categories, catalogData] = await Promise.all([
    getPublishedCategories(),
    getFilteredCatalogProducts({ categorySlug: categorySlug, pageSize: 20 }),
  ]);

  const currentCategory = categories.find(c => c.slug === categorySlug);
  const { products } = catalogData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-amber-600">الرئيسية</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="font-bold text-gray-900">{currentCategory?.name || categorySlug}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {currentCategory?.name || "القسم"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">عرض {products.length} منتج في هذا القسم</p>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
            <PackageX className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">لا توجد منتجات في هذا القسم حالياً</h2>
            <Link href="/products" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-amber-600 transition-colors">تصفح كل المنتجات</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}