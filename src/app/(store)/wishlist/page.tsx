"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { getWishlistProductsAction } from "../wishlist-actions";
import type { CatalogProductSummary } from "@/lib/services/catalog.service";

const STORAGE_KEY = "eg_clothing_wishlist_v1";

export default function WishlistPage() {
  const [products, setProducts] = useState<CatalogProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const ids = raw ? JSON.parse(raw) as string[] : [];
      
      if (ids.length === 0) {
        setIsLoading(false);
        return;
      }

      const res = await getWishlistProductsAction(ids);
      setProducts(res);
      setIsLoading(false);
    }
    loadWishlist();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 fill-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">قائمة الأمنيات</h1>
            <p className="text-sm text-gray-500 mt-1">{products.length} منتج محفوظ</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">قائمة الأمنيات فارغة</h2>
            <p className="text-sm text-gray-500 mb-6">أضف المنتجات التي تعجبك بالضغط على أيقونة القلب.</p>
            <Link href="/products" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-amber-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              تصفح المنتجات
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
    </div>
  );
}