import React from "react";
import Link from "next/link";
import {
  Flame,
  Tag,
  ShieldCheck,
  Truck,
  RefreshCw,
  Percent,
} from "lucide-react";
import {
  getStoreSettings,
  getPublishedCategories,
  getHomePageSections,
  getActiveBanners,
} from "@/lib/services/catalog.service";
import { ProductCard } from "@/components/store/ProductCard";
import HeroSlider from "@/components/store/HeroSlider";

export const dynamic = "force-dynamic";

export default async function StoreHomePage() {
  const [settings, categories, sections, banners] = await Promise.all([
    getStoreSettings(),
    getPublishedCategories(),
    getHomePageSections(),
    getActiveBanners(),
  ]);

  return (
    <div className="space-y-12 pb-16 bg-gray-50/50">
      
      {/* 1. البانر الرئيسي المتحرك */}
      <HeroSlider banners={banners} />

      {/* 2. بانر الكوبونات */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-4 text-white text-center sm:text-right">
            <div className="hidden sm:flex w-14 h-14 bg-white/20 rounded-full items-center justify-center backdrop-blur-md">
              <Percent className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold mb-1">
                خصم خاص لأول عملية شراء!
              </h3>
              <p className="text-sm text-amber-50">
                استخدم كود <strong className="bg-white text-amber-600 px-2 py-0.5 rounded-md font-mono mx-1">WELCOME10</strong> واحصل على خصم 10% عند الدفع.
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="whitespace-nowrap bg-white text-amber-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            اطلب الآن
          </Link>
        </div>
      </section>

      {/* 3. التصنيفات */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block"></span>
              تسوق حسب القسم
            </h2>
            <Link
              href="/products"
              className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline"
            >
              عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative p-6 rounded-2xl border border-gray-200 bg-white hover:border-amber-500 hover:shadow-lg transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[120px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  {cat.name}
                </span>
                <span className="relative z-10 text-[11px] text-gray-400 mt-2 group-hover:text-amber-500 font-medium">
                  تصفح القسم &larr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. أحدث المنتجات */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
             <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block"></span>
            أحدث المنتجات
          </h2>
          <Link
            href="/products?sort=newest"
            className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline"
          >
            عرض جميع المنتجات
          </Link>
        </div>

        {sections.latestProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center bg-white">
            <p className="text-base font-bold text-gray-700">لا توجد منتجات منشورة حالياً</p>
            <p className="text-xs text-gray-500 mt-1">سيتم إضافة المنتجات قريباً جداً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sections.latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. الأكثر مبيعاً */}
      {sections.bestSellingProducts.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Flame className="w-5 h-5 text-rose-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                الأكثر مبيعاً
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {sections.bestSellingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. العروض والخصومات */}
      {sections.discountedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              عروض وخصومات
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {sections.discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 7. مزايا المتجر (تم نقلها إلى أسفل الصفحة) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white shadow-sm border border-gray-100 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
              <Truck className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">شحن لكل المحافظات</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              توصيل سريع لحد باب البيت مع الدفع نقداً عند الاستلام.
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-3 p-4 md:border-x border-y md:border-y-0 border-gray-100 py-6 md:py-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">
              استبدال خلال {settings.return_window_days || 14} يوماً
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              سياسة استبدال مقاسات واضحة وسهلة لضمان راحتك.
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">جودة مضمونة 100%</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              مخزون حقيقي ومحدث لحظياً. لا نعرض إلا القطع المتاحة.
            </p>
          </div>
        </div>
      </section>
      
    </div>
  );
}