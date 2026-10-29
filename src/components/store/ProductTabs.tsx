"use client";

import React, { useState } from "react";
import { Star, MessageSquare, Info, CheckCircle2 } from "lucide-react";
import { submitReviewAction } from "@/app/(store)/products/[slug]/actions";

export default function ProductTabs({
  productId,
  productSlug,
  description,
  reviews,
}: {
  productId: string;
  productSlug: string;
  description: string | null;
  reviews: any[];
}) {
  const [activeTab, setActiveTab] = useState<"desc" | "reviews">("desc");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rating, setRating] = useState(5);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append("product_id", productId);
    formData.append("product_slug", productSlug);
    formData.append("rating", rating.toString());

    const res = await submitReviewAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setMsg({ type: "success", text: "تم إضافة تقييمك بنجاح! شكراً لك." });
      (e.target as HTMLFormElement).reset();
      setRating(5);
    } else {
      setMsg({ type: "error", text: res.error || "حدث خطأ." });
    }
  }

  // ✅ تقسيم الوصف إلى نقاط مع أيقونات (الشكل الاحترافي)
  const formattedDescription = description
    ?.split('\n')
    .filter(line => line.trim() !== '')
    .map((line, idx) => (
      <div key={idx} className="flex items-start gap-3 mb-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base m-0">
          {line}
        </p>
      </div>
    ));

  return (
    <div className="mt-16 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
      {/* أزرار التبويبات */}
      <div className="flex border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => setActiveTab("desc")}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === "desc" ? "text-amber-600 border-b-2 border-amber-600 bg-white" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Info className="w-4 h-4" /> الوصف والتفاصيل
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === "reviews" ? "text-amber-600 border-b-2 border-amber-600 bg-white" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <MessageSquare className="w-4 h-4" /> التقييمات ({reviews.length})
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {/* 1. تبويب الوصف */}
        {activeTab === "desc" && (
          <div className="prose max-w-none">
            {description ? (
              <div className="space-y-1">
                {formattedDescription}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">لا يوجد وصف تفصيلي لهذا المنتج حالياً.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. تبويب التقييمات */}
        {activeTab === "reviews" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* قائمة التقييمات */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl font-black text-gray-900">{avgRating}</div>
                <div>
                  <div className="flex text-amber-500 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(avgRating)) ? "fill-amber-500" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">بناءً على {reviews.length} تقييم</p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-xl text-center">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">لا توجد تقييمات بعد.</p>
                  <p className="text-xs text-gray-500 mt-1">كن أول من يقيّم هذا المنتج!</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold">
                          {rev.customer_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">{rev.customer_name}</span>
                          <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString("ar-EG")}</span>
                        </div>
                      </div>
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= rev.rating ? "fill-amber-500" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p className="text-sm text-gray-600 leading-relaxed mt-2">{rev.comment}</p>}
                  </div>
                ))
              )}
            </div>

            {/* نموذج إضافة تقييم */}
            <div className="bg-gray-50 p-6 rounded-2xl h-fit border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">أضف تقييمك</h3>
              
              {msg && (
                <div className={`p-3 mb-4 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                  {msg.type === "success" && <CheckCircle2 className="w-4 h-4" />}
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">تقييمك للمنتج</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)}>
                        <Star className={`w-7 h-7 ${star <= rating ? "fill-amber-500 text-amber-500" : "fill-gray-200 text-gray-200"} transition-colors`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الاسم</label>
                  <input required name="name" className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none" placeholder="اسمك" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">تعليق (اختياري)</label>
                  <textarea name="comment" rows={3} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none resize-none" placeholder="رأيك في المنتج..." />
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50">
                  {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}