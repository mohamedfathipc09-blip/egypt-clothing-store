"use client";

import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Ruler,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  X,
  ImageOff,
  Plus,
  Minus,
  MessageCircle,
  Star,
} from "lucide-react";
import { formatEGP } from "@/lib/utils/currency";
import ShareButton from "./ShareButton";

interface VariantItem {
  id: string;
  sku: string;
  selling_price?: number;
  price?: number;
  price_override?: number;
  compare_at_price: number | null;
  size: any;
  color: any;
  available_qty?: number;
  stock_quantity?: number;
}

interface ProductImageItem {
  id?: string;
  image_url: string;
  alt_text?: string;
}

interface SizeGuideRow {
  size: string;
  chest_cm: string;
  length_cm: string;
  shoulder_cm?: string;
}

export function VariantAndCartControls({
  productId,
  productName,
  productSlug,
  productCode,
  shortDescription,
  basePrice,
  compareAtPrice,
  images,
  variants,
  sizeGuide,
  whatsappShareUrl,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  productCode: string;
  shortDescription: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  images: ProductImageItem[];
  variants: VariantItem[];
  sizeGuide: SizeGuideRow[];
  whatsappShareUrl: string;
}) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const normalizedVariants = useMemo(() => {
    return (variants || []).map((v, idx) => {
      const sizeVal = typeof v.size === "object" && v.size !== null ? v.size : { id: String(v.size || idx), code: String(v.size || "Standard"), name_ar: String(v.size || "Standard") };
      const colorVal = typeof v.color === "object" && v.color !== null ? v.color : { id: String(v.color || idx), code: String(v.color || "Default"), name_ar: String(v.color || "Default"), hex_code: "#000000" };
      const qty = Number(v.available_qty ?? v.stock_quantity ?? 0);
      const price = Number(v.selling_price ?? v.price_override ?? v.price ?? basePrice);

      return { ...v, size: sizeVal, color: colorVal, available_qty: qty, selling_price: price };
    });
  }, [variants, basePrice]);

  const uniqueSizes = useMemo(() => {
    const map = new Map<string, any>();
    for (const v of normalizedVariants) if (!map.has(v.size.id)) map.set(v.size.id, v.size);
    return Array.from(map.values());
  }, [normalizedVariants]);

  const uniqueColors = useMemo(() => {
    const map = new Map<string, any>();
    for (const v of normalizedVariants) if (!map.has(v.color.id)) map.set(v.color.id, v.color);
    return Array.from(map.values());
  }, [normalizedVariants]);

  const selectedVariant = useMemo(() => {
    if (!selectedSizeId || !selectedColorId) return null;
    return normalizedVariants.find((v) => v.size.id === selectedSizeId && v.color.id === selectedColorId) ?? null;
  }, [normalizedVariants, selectedSizeId, selectedColorId]);

  const activePrice = selectedVariant ? (selectedVariant.selling_price ?? basePrice) : basePrice;
  const activeComparePrice = selectedVariant ? selectedVariant.compare_at_price : compareAtPrice;
  const maxAllowedQty = selectedVariant ? (selectedVariant.available_qty ?? 0) : 0;

  function handleAddToCart() {
    setFeedbackMsg(null);
    if (!selectedSizeId || !selectedColorId) {
      setFeedbackMsg({ type: "error", text: "يرجى اختيار المقاس واللون أولاً." });
      return;
    }
    if (!selectedVariant || (selectedVariant.available_qty ?? 0) <= 0) {
      setFeedbackMsg({ type: "error", text: "هذا المقاس واللون غير متوفرين حالياً." });
      return;
    }
    try {
      const storageKey = "eg_clothing_cart_v1";
      const raw = window.localStorage.getItem(storageKey);
      const cart: Array<any> = raw ? JSON.parse(raw) : [];
      const existingIdx = cart.findIndex((item) => item.variantId === selectedVariant.id);

      if (existingIdx >= 0 && cart[existingIdx]) {
        cart[existingIdx].quantity += quantity;
      } else {
        cart.push({
          variantId: selectedVariant.id,
          productId,
          productName,
          productSlug,
          sku: selectedVariant.sku,
          sizeName: selectedVariant.size.name_ar || selectedVariant.size.code,
          colorName: selectedVariant.color.name_ar || selectedVariant.color.code,
          unitPricePreview: selectedVariant.selling_price,
          imageUrl: images[0]?.image_url ?? null,
          quantity,
          maxAvailablePreview: selectedVariant.available_qty,
        });
      }
      window.localStorage.setItem(storageKey, JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
      setFeedbackMsg({ type: "success", text: "تمت الإضافة إلى السلة بنجاح!" });
    } catch {
      setFeedbackMsg({ type: "error", text: "حدث خطأ، يرجى المحاولة مرة أخرى." });
    }
  }

  const currentImage = images[selectedImageIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
      
      {/* 1. معرض الصور (العمود الأيمن) */}
      <div className="space-y-4 sticky top-24">
        <div className="relative aspect-[4/5] rounded-3xl bg-gray-50 border border-gray-100 overflow-hidden group">
          {currentImage && currentImage.image_url ? (
            <>
              <img
                src={currentImage.image_url}
                alt={currentImage.alt_text || productName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-4 right-4 p-3 rounded-full bg-white/80 backdrop-blur-md text-gray-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <ImageOff className="w-12 h-12 mb-2" />
              <p>لا توجد صورة</p>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setSelectedImageIdx(idx)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  idx === selectedImageIdx ? "border-amber-500 ring-2 ring-amber-500/20" : "border-gray-100 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. تفاصيل المنتج (العمود الأيسر) */}
      <div className="flex flex-col">
        
        {/* ✅ العنوان وأزرار المشاركة (التي كانت مفقودة) */}
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {productName}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                {productCode}
              </span>
              <div className="flex items-center gap-1 text-amber-500 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <Star className="w-3.5 h-3.5 fill-amber-500" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={whatsappShareUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
              title="شارك على واتساب"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <ShareButton />
          </div>
        </div>

        {/* السعر */}
        <div className="flex items-end gap-3 py-4 border-b border-gray-100">
          <span className="text-2xl sm:text-3xl font-black text-gray-900">
            {formatEGP(activePrice)}
          </span>
          {activeComparePrice && activeComparePrice > activePrice && (
            <span className="text-lg text-gray-400 line-through mb-1">
              {formatEGP(activeComparePrice)}
            </span>
          )}
        </div>

        {/* الوصف المختصر */}
        {shortDescription && (
          <p className="text-sm text-gray-500 py-4 leading-relaxed border-b border-gray-100 mb-4">
            {shortDescription}
          </p>
        )}

        {/* المقاسات */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-extrabold text-gray-900">اختر المقاس</span>
            {sizeGuide.length > 0 && (
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs font-bold text-amber-600 flex items-center gap-1 hover:underline"
              >
                <Ruler className="w-4 h-4" /> دليل المقاسات
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {uniqueSizes.map((size) => {
              const isSelected = selectedSizeId === size.id;
              const hasStock = normalizedVariants.some(v => v.size.id === size.id && v.available_qty > 0);
              return (
                <button
                  key={size.id}
                  onClick={() => { setSelectedSizeId(size.id); setQuantity(1); }}
                  disabled={!hasStock}
                  className={`min-w-[3.5rem] h-12 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                    isSelected ? "bg-gray-900 border-gray-900 text-white shadow-md" 
                    : hasStock ? "bg-white border-gray-200 text-gray-700 hover:border-gray-900" 
                    : "bg-gray-50 border-gray-100 text-gray-400 line-through cursor-not-allowed"
                  }`}
                >
                  {size.code || size.name_ar}
                </button>
              );
            })}
          </div>
        </div>

        {/* الألوان */}
        <div className="mb-6">
          <span className="block text-sm font-extrabold text-gray-900 mb-3">اختر اللون</span>
          <div className="flex flex-wrap gap-3">
            {uniqueColors.map((color) => {
              const isSelected = selectedColorId === color.id;
              const isAvailable = selectedSizeId
                ? normalizedVariants.some(v => v.size.id === selectedSizeId && v.color.id === color.id && v.available_qty > 0)
                : normalizedVariants.some(v => v.color.id === color.id && v.available_qty > 0);

              return (
                <button
                  key={color.id}
                  onClick={() => { setSelectedColorId(color.id); setQuantity(1); }}
                  className={`w-10 h-10 rounded-full border-2 transition-all p-0.5 ${
                    isSelected ? "border-gray-900 scale-110 shadow-sm" 
                    : isAvailable ? "border-gray-200 hover:border-gray-400" 
                    : "border-gray-100 opacity-40 cursor-not-allowed"
                  }`}
                  title={color.name_ar || color.code}
                >
                  <span className="block w-full h-full rounded-full border border-gray-900/10 shadow-inner" style={{ backgroundColor: color.hex_code || "#000" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* التوفر والكمية */}
        <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
          {!selectedSizeId || !selectedColorId ? (
            <p className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> يرجى تحديد المقاس واللون لعرض التوفر
            </p>
          ) : !selectedVariant || selectedVariant.available_qty <= 0 ? (
            <p className="text-sm font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> هذه التركيبة غير متوفرة حالياً
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> متوفر ({selectedVariant.available_qty} قطع)
              </span>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-1.5 py-1 shadow-sm">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-black w-5 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(maxAllowedQty, q + 1))} disabled={quantity >= maxAllowedQty} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* زر الإضافة */}
        <div className="mt-auto pt-2">
          <button
            onClick={handleAddToCart}
            disabled={!selectedSizeId || !selectedColorId || maxAllowedQty <= 0}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-900 text-white text-base font-extrabold hover:bg-amber-600 transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-xl shadow-gray-900/10 hover:-translate-y-0.5 disabled:transform-none"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>إضافة إلى السلة</span>
          </button>

          {feedbackMsg && (
            <div className={`mt-3 p-3 rounded-xl text-sm font-bold text-center ${feedbackMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {feedbackMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* المودالات */}
      {isZoomOpen && currentImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setIsZoomOpen(false)} className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20">
            <X className="w-6 h-6" />
          </button>
          <img src={currentImage.image_url} alt="" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}

      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">دليل المقاسات</h3>
              <button onClick={() => setIsSizeGuideOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-sm text-right text-gray-600">
                <thead className="text-xs text-gray-900 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 rounded-r-lg">المقاس</th>
                    <th className="px-4 py-3">الصدر</th>
                    <th className="px-4 py-3">الطول</th>
                    <th className="px-4 py-3 rounded-l-lg">الكتف</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-4 font-bold text-gray-900">{row.size}</td>
                      <td className="px-4 py-4">{row.chest_cm}</td>
                      <td className="px-4 py-4">{row.length_cm}</td>
                      <td className="px-4 py-4">{row.shoulder_cm || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}