"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function HeroSlider({ banners }: { banners: any[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000); // يغير البانر كل 5 ثواني
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-gray-900 group">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* الصورة */}
          <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
          
          {/* طبقة تعتيم */}
          <div className="absolute inset-0 bg-black/40" />

          {/* المحتوى */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 space-y-4 text-white">
            <h1 className="text-3xl sm:text-5xl font-extrabold drop-shadow-lg">{banner.title}</h1>
            <p className="text-lg sm:text-xl font-medium drop-shadow-md">{banner.subtitle}</p>
            {banner.cta_text && banner.cta_link && (
              <Link href={banner.cta_link} className="mt-4 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl transition transform hover:scale-105">
                {banner.cta_text}
              </Link>
            )}
          </div>
        </div>
      ))}

      {/* أزرار التنقل */}
      {banners.length > 1 && (
        <>
          <button onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)} className="absolute start-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <button onClick={() => setCurrent((prev) => (prev + 1) % banners.length)} className="absolute end-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, idx) => (
              <button key={idx} onClick={() => setCurrent(idx)} className={`w-2.5 h-2.5 rounded-full transition-all ${idx === current ? "bg-amber-500 w-6" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}