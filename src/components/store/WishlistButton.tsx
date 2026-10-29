"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const STORAGE_KEY = "eg_clothing_wishlist_v1";

export default function WishlistButton({ productId, className = "" }: { productId: string, className?: string }) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    function checkWishlist() {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) as string[] : [];
      setIsLiked(list.includes(productId));
    }
    checkWishlist();
    window.addEventListener("wishlist-updated", checkWishlist);
    return () => window.removeEventListener("wishlist-updated", checkWishlist);
  }, [productId]);

  function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault(); // لمنع فتح رابط المنتج إذا كان الزر داخل <Link>
    e.stopPropagation();
    
    const raw = window.localStorage.getItem(STORAGE_KEY);
    let list = raw ? JSON.parse(raw) as string[] : [];
    
    if (list.includes(productId)) {
      list = list.filter(id => id !== productId);
      setIsLiked(false);
    } else {
      list.push(productId);
      setIsLiked(true);
    }
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("wishlist-updated"));
  }

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm ${
        isLiked 
          ? "bg-rose-50 text-rose-600 hover:bg-rose-100" 
          : "bg-white/80 text-gray-500 hover:bg-white hover:text-rose-500"
      } ${className}`}
      aria-label={isLiked ? "إزالة من المفضلة" : "أضف للمفضلة"}
    >
      <Heart className={`w-5 h-5 ${isLiked ? "fill-rose-600" : ""}`} />
    </button>
  );
}