import React from "react";
import Link from "next/link";
import { getFilteredCatalogProducts, getPublishedCategories, getActiveAttributes } from "@/lib/services/catalog.service";
import { ProductCard } from "@/components/store/ProductCard";
import ProductFilters from "@/components/store/ProductFilters";
import ProductSort from "@/components/store/ProductSort";
import { Filter, PackageX } from "lucide-react";
export const dynamic = 'force-dynamic';
export const dynamic = "force-dynamic";

export default async function StoreProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const categorySlug = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const sizeCode = typeof searchParams.size === "string" ? searchParams.size : undefined;
  const colorCode = typeof searchParams.color === "string" ? searchParams.color : undefined;
  const minPrice = typeof searchParams.min === "string" ? Number(searchParams.min) : undefined;
  const maxPrice = typeof searchParams.max === "string" ? Number(searchParams.max) : undefined;
  const inStock = searchParams.instock === "true";
  const sort = (typeof searchParams.sort === "string" ? searchParams.sort : "newest") as any;
  const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1;

  const [categories, attributes, catalogData] = await Promise.all([
    getPublishedCategories(),
    getActiveAttributes(),
    getFilteredCatalogProducts({ q, categorySlug, sizeCode, colorCode, minPrice, maxPrice, inStockOnly: inStock, sort, page, pageSize: 12 }),
  ]);

  const { products, totalCount } = catalogData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {categorySlug ? `قسم: ${categories.find(c => c.slug === categorySlug)?.name || categorySlug}` : "جميع المنتجات"}
            </h1>
            <p className="text-sm text-gray-500 mt-2">عرض {totalCount} منتج</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <ProductFilters categories={categories} sizes={attributes.sizes} colors={attributes.colors} />
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 mb-6">
              <button className="flex items-center gap-2 text-sm font-bold text-gray-700 lg:hidden">
                <Filter className="w-4 h-4" /> الفلاتر
              </button>
              <div className="flex items-center gap-2 ms-auto">
                <span className="text-sm text-gray-500 hidden sm:block">ترتيب حسب:</span>
                <ProductSort />
              </div>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
                <PackageX className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">لا توجد منتجات مطابقة</h2>
                <Link href="/products" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-amber-600 transition-colors">مسح الفلاتر</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}