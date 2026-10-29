"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingBag, Menu, User, UserCheck, Truck, Loader2, LogOut, Heart } from "lucide-react";
import StoreSidebar from "./StoreSidebar";
import { searchProductsAction } from "@/app/(store)/search-action";
import { formatEGP } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { logoutCustomerAction } from "@/app/(store)/auth-actions";

interface HeaderProps {
  storeName: string;
  logoUrl: string | null;
  freeShippingThreshold: number | null;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export function Header({
  storeName = "متجر الملابس",
  logoUrl,
  freeShippingThreshold,
  categories = [],
}: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoadingUser(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function syncCartCount() {
      try {
        const raw = window.localStorage.getItem("eg_clothing_cart_v1");
        if (!raw) { setCartCount(0); return; }
        const items = JSON.parse(raw) as Array<{ quantity: number }>;
        setCartCount(items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0));
      } catch { setCartCount(0); }
    }
    syncCartCount();
    window.addEventListener("cart-updated", syncCartCount);
    window.addEventListener("storage", syncCartCount);
    return () => {
      window.removeEventListener("cart-updated", syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  useEffect(() => {
    function syncWishlistCount() {
      try {
        const raw = window.localStorage.getItem("eg_clothing_wishlist_v1");
        const list = raw ? JSON.parse(raw) : [];
        setWishlistCount(list.length);
      } catch { setWishlistCount(0); }
    }
    syncWishlistCount();
    window.addEventListener("wishlist-updated", syncWishlistCount);
    return () => window.removeEventListener("wishlist-updated", syncWishlistCount);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setIsDropdownOpen(true);
        const res = await searchProductsAction(searchQuery);
        setResults(res);
        setIsSearching(false);
      } else {
        setResults([]);
        setIsDropdownOpen(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsDropdownOpen(false);
    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  return (
    <>
      <StoreSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} categories={categories} />

      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="bg-gray-900 text-white text-[11px] sm:text-xs py-2 text-center font-medium tracking-wide">
          🚚 شحن مجاني للطلبات فوق {freeShippingThreshold ? `${freeShippingThreshold} ج.م` : "500 ج.م"} | الدفع عند الاستلام متاح
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-gray-700 hover:text-amber-600 transition-colors md:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <Link href="/" className="flex items-center gap-2 shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="h-10 object-contain" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {storeName.split(" ")[0]} <span className="text-amber-600">{storeName.split(" ")[1] || ""}</span>
                  </span>
                )}
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim().length >= 2) setIsDropdownOpen(true); }}
                  placeholder="ابحث عن منتج..."
                  className="w-full bg-gray-100 border-none rounded-full py-3 px-5 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </div>
              </form>

              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {results.length > 0 ? (
                    <>
                      <div className="p-2">
                        {results.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-4 p-2 hover:bg-amber-50 rounded-xl transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">بدون</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs font-extrabold text-amber-600">{formatEGP(product.price)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/products?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block text-center text-xs font-bold text-amber-600 bg-gray-50 p-3 border-t border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        عرض كل النتائج
                      </Link>
                    </>
                  ) : !isSearching ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      لا توجد منتجات مطابقة لبحثك.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {isLoadingUser ? (
                 <div className="p-2"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : user ? (
                <Link href="/account" className="p-2 text-gray-700 hover:text-amber-600 transition-colors" title="حسابي">
                  <UserCheck className="w-6 h-6" />
                </Link>
              ) : (
                <Link href="/login" className="p-2 text-gray-700 hover:text-amber-600 transition-colors" title="تسجيل الدخول">
                  <User className="w-6 h-6" />
                </Link>
              )}
              
              <Link href="/wishlist" className="p-2 text-gray-700 hover:text-rose-600 transition-colors relative" title="قائمة الأمنيات">
                <Heart className="w-6 h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="p-2 text-gray-700 hover:text-amber-600 transition-colors relative">
                <ShoppingBag className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ✅ شريط التنقل السفلي (مع رابط الرئيسية) */}
        <nav className="hidden md:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-12">
            {/* ✅ رابط الرئيسية الجديد */}
            <Link href="/" className="text-sm font-bold text-gray-900 hover:text-amber-600 transition-colors">
              الرئيسية
            </Link>
            
            <Link href="/products" className="text-sm font-bold text-gray-800 hover:text-amber-600 transition-colors">
              كل المنتجات
            </Link>
            
            {categories.slice(0, 5).map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`} className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
                {cat.name}
              </Link>
            ))}
            
            <Link href="/track-order" className="text-sm font-bold text-rose-600 hover:text-rose-700 mr-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              تتبع طلبك
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}