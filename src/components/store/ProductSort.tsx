"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function ProductSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "newest";

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={currentSort}
      onChange={handleSortChange}
      className="bg-transparent text-sm font-bold text-gray-900 border-none focus:ring-0 cursor-pointer outline-none"
    >
      <option value="newest">الأحدث</option>
      <option value="price_asc">السعر: من الأقل للأعلى</option>
      <option value="price_desc">السعر: من الأعلى للأقل</option>
      <option value="best_selling">الأكثر مبيعاً</option>
    </select>
  );
}