"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEGP } from "@/lib/utils/currency";

interface ViewedProduct {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  price: number;
}

// ✅ أضفنا نوع Props عشان نقبل excludeProductId
interface RecentlyViewedProps {
  excludeProductId?: string;
}

export default function RecentlyViewed({ excludeProductId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("recently_viewed");
    if (stored) {
      try {
        const parsed: ViewedProduct[] = JSON.parse(stored);
        
        // ✅ بنفلتر المنتج الحالي عشان ميتعرضش
        const filtered = excludeProductId
          ? parsed.filter((p) => p.id !== excludeProductId)
          : parsed;
          
        setProducts(filtered);
      } catch (e) {
        console.error("Failed to parse recently viewed products", e);
      }
    }
  }, [excludeProductId]); // بنضيفه هنا عشان لو تغير المنتج، القائمة تتحدث

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 mt-12" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">شاهدت مؤخراً</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={`/products/${product.slug}`}
            className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="relative aspect-[4/5] bg-gray-50">
              <img
                src={product.image_url || "/placeholder.jpg"}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            <div className="p-4 text-right">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {product.title}
              </h3>
              <p className="text-amber-600 font-bold mt-2">
                {formatEGP(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}