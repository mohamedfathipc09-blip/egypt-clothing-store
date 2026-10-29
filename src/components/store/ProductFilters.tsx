"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, ChevronDown, Check } from "lucide-react";

export default function ProductFilters({ 
  categories, 
  sizes, 
  colors 
}: { 
  categories: any[]; 
  sizes: any[]; 
  colors: any[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentSize = searchParams.get("size") || "";
  const currentColor = searchParams.get("color") || "";
  const currentMin = searchParams.get("min") || "";
  const currentMax = searchParams.get("max") || "";
  const isInStock = searchParams.get("instock") === "true";

  const [minPrice, setMinPrice] = useState(currentMin);
  const [maxPrice, setMaxPrice] = useState(currentMax);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyPriceFilter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("min", minPrice);
    else params.delete("min");
    if (maxPrice) params.set("max", maxPrice);
    else params.delete("max");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasActiveFilters = currentCategory || currentSize || currentColor || currentMin || currentMax || isInStock;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">الفلاتر</h2>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> مسح الكل
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* الأقسام */}
        {categories.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              الأقسام <ChevronDown className="w-4 h-4 text-gray-400" />
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    currentCategory === cat.slug ? "bg-amber-600 border-amber-600" : "border-gray-300 group-hover:border-amber-500"
                  }`}>
                    {currentCategory === cat.slug && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${currentCategory === cat.slug ? "font-bold text-amber-600" : "text-gray-600"}`}>{cat.name}</span>
                  <input type="checkbox" className="hidden" checked={currentCategory === cat.slug} onChange={() => updateParam("category", currentCategory === cat.slug ? null : cat.slug)} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* المقاسات */}
        {sizes.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              المقاسات <ChevronDown className="w-4 h-4 text-gray-400" />
            </h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => updateParam("size", currentSize === size.code ? null : size.code)}
                  className={`min-w-[40px] h-9 px-3 rounded-lg text-sm font-bold border transition-colors ${
                    currentSize === size.code ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"
                  }`}
                >
                  {size.code}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* الألوان */}
        {colors.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              الألوان <ChevronDown className="w-4 h-4 text-gray-400" />
            </h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => updateParam("color", currentColor === color.code ? null : color.code)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${currentColor === color.code ? "border-gray-900 scale-110 shadow-sm" : "border-transparent hover:scale-110"}`}
                  style={{ backgroundColor: color.hex_code || "#000" }}
                  title={color.name_ar}
                />
              ))}
            </div>
          </div>
        )}

        {/* السعر */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
            السعر (ج.م) <ChevronDown className="w-4 h-4 text-gray-400" />
          </h3>
          <form onSubmit={applyPriceFilter} className="flex items-center gap-2">
            <input type="number" placeholder="من" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500" />
            <span className="text-gray-400">-</span>
            <input type="number" placeholder="إلى" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500" />
            <button type="submit" className="h-9 px-3 bg-gray-100 text-gray-900 text-xs font-bold rounded-lg hover:bg-gray-200">تطبيق</button>
          </form>
        </div>

        {/* التوفر */}
        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-9 h-5 rounded-full transition-colors relative ${isInStock ? "bg-amber-600" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isInStock ? "start-0.5 translate-x-full" : "start-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">المتوفر فقط</span>
            <input type="checkbox" className="hidden" checked={isInStock} onChange={() => updateParam("instock", isInStock ? null : "true")} />
          </label>
        </div>
      </div>
    </div>
  );
}