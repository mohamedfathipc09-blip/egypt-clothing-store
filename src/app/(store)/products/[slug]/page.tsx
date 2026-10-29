import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublishedProductBySlug,
  getStoreSettings,
  getProductReviews,
} from "@/lib/services/catalog.service";
import { VariantAndCartControls } from "@/components/store/VariantAndCartControls";
import { ProductCard } from "@/components/store/ProductCard";
import ProductTabs from "@/components/store/ProductTabs";
import RecentlyViewed from "@/components/store/RecentlyViewed"; // ✅ استيراد مكون شاهدت مؤخراً
import TrackRecentlyViewed from "@/components/store/TrackRecentlyViewed"; // ✅ استيراد مكون تسجيل المشاهدة
import { ShieldCheck, Truck, RefreshCw, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getPublishedProductBySlug(params.slug);
  if (!product) return { title: "المنتج غير موجود" };

  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.short_description || `اشترِ ${product.name} بأفضل سعر في مصر.`,
    openGraph: {
      title: product.seo_title || product.name,
      description: product.short_description ?? "",
      images: product.images[0]?.image_url ? [product.images[0].image_url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, settings] = await Promise.all([
    getPublishedProductBySlug(params.slug),
    getStoreSettings(),
  ]);

  if (!product) notFound();

  const reviews = await getProductReviews(product.id);

  const sizeGuide =
    product.size_guide_override && product.size_guide_override.length > 0
      ? product.size_guide_override
      : settings.size_guide_default;

  const whatsappShareUrl = `https://wa.me/?text=شاهد هذا المنتج: ${encodeURIComponent(product.name)} - ${encodeURIComponent(`http://localhost:3000/products/${product.slug}`)}`;

  return (
    <div className="bg-white min-h-screen pb-16">
      
      {/* ✅ تسجيل المشاهدة (لا يظهر للعميل، يعمل في الخلفية) */}
      <TrackRecentlyViewed productId={product.id} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* مسار التنقل */}
        <nav className="text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-2 mb-6">
          <Link href="/" className="hover:text-amber-600 transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3 text-gray-300" />
          <Link href="/products" className="hover:text-amber-600 transition-colors">المنتجات</Link>
          {product.category && (
            <>
              <ChevronLeft className="w-3 h-3 text-gray-300" />
              <Link href={`/categories/${product.category.slug}`} className="hover:text-amber-600 transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronLeft className="w-3 h-3 text-gray-300" />
          <span className="text-gray-900 font-bold">{product.name}</span>
        </nav>

        {/* المكون الرئيسي */}
        <VariantAndCartControls
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          productCode={product.product_code}
          shortDescription={product.short_description}
          basePrice={product.base_price}
          compareAtPrice={product.compare_at_price}
          images={product.images}
          variants={product.variants}
          sizeGuide={sizeGuide}
          whatsappShareUrl={whatsappShareUrl}
        />

        {/* شريط الثقة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100 my-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 mb-1">شحن سريع</h3>
              <p className="text-xs text-gray-500">توصيل لجميع المحافظات</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600 shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 mb-1">استبدال مجاني</h3>
              <p className="text-xs text-gray-500">خلال {settings.return_window_days || 14} يوماً</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 mb-1">دفع آمن</h3>
              <p className="text-xs text-gray-500">الدفع نقداً عند الاستلام</p>
            </div>
          </div>
        </div>

        {/* التبويبات (الوصف والتقييمات) */}
        <ProductTabs 
          productId={product.id} 
          productSlug={product.slug} 
          description={product.long_description} 
          reviews={reviews} 
        />

        {/* منتجات ذات صلة */}
        {product.relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block"></span>
                منتجات مشابهة قد تعجبك
              </h2>
              <Link href="/products" className="text-sm font-bold text-amber-600 hover:underline">عرض الكل</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {product.relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}

        {/* ✅ قسم شاهدت مؤخراً (يظهر في أسفل الصفحة) */}
        <RecentlyViewed excludeProductId={product.id} />

      </div>
    </div>
  );
}