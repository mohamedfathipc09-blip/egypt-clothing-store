"use client";

import React, { useEffect, useState } from "react";
import { ProductCard } from "@/components/store/ProductCard";
import { getWishlistProductsAction } from "@/app/(store)/wishlist-actions";
import type { CatalogProductSummary } from "@/lib/services/catalog.service";
import { Clock } from "lucide-react";

const STORAGE_KEY = "eg_clothing_recently_viewed_v1";

export default function RecentlyViewed({ excludeProductId }: { excludeProductId?: string }) {
  const [products, setProducts] = useState<CatalogProductSummary[]>([]);

  useEffect(() => {
    async function load() {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      
      // استبعاد المنتج الحالي من القائمة
      const filtered = ids.filter((id) => id !== excludeProductId).slice(0, 4);
      
      if (filtered.length === 0) return;

      const res = await getWishlistProductsAction(filtered);
      setProducts(res);
    }
    load();
  }, [excludeProductId]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          شاهدت مؤخراً
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}