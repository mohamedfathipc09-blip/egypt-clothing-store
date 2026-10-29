"use client";

import React, { useState } from "react";
import {
  createCategoryAction,
  createProductWithVariantAction,
  addVariantToProductAction,
  updateVariantStockAction,
} from "@/app/admin/actions";
import { Plus, Save, PackageCheck, AlertCircle, FolderPlus, UploadCloud, X } from "lucide-react";

export default function ProductsManagerClient({
  products,
  categories,
}: {
  products: any[];
  categories: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews = Array.from(files).map((file) => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
    } else {
      setImagePreviews([]);
    }
  };

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const res = await createCategoryAction(new FormData(form));
    setLoading(false);
    if (!res.success) {
      setMessage({ type: "err", text: res.error || "تعذر إضافة القسم" });
    } else {
      setMessage({ type: "ok", text: "تم إنشاء القسم بنجاح!" });
      form.reset();
    }
  }

  async function handleCreateProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const res = await createProductWithVariantAction(new FormData(form));
    setLoading(false);

    if (!res.success) {
      setMessage({ type: "err", text: res.error || "خطأ أثناء الإضافة" });
    } else {
      setMessage({ type: "ok", text: "تمت إضافة المنتج والمخزون الافتتاحي بنجاح!" });
      form.reset();
      setImagePreviews([]);
    }
  }

  async function handleAddVariant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const res = await addVariantToProductAction(new FormData(form));
    setLoading(false);

    if (!res.success) {
      setMessage({ type: "err", text: res.error || "تعذر إضافة المقاس" });
    } else {
      setMessage({ type: "ok", text: "تمت إضافة المقاس واللون الجديد بنجاح!" });
      form.reset();
    }
  }

  async function handleUpdateStock(variantId: string, currentStock: number) {
    const newStock = stockEdits[variantId] ?? currentStock;
    setLoading(true);
    setMessage(null);
    const res = await updateVariantStockAction({ variantId, newStock });
    setLoading(false);

    if (!res.success) {
      setMessage({ type: "err", text: res.error || "تعذر تحديث الكمية" });
    } else {
      setMessage({ type: "ok", text: "تم تحديث كمية المخزون وتوثيق الحركة بنجاح!" });
    }
  }

  return (
    <div className="space-y-8 text-gray-900">
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-medium ${message.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          {message.type === "ok" ? <PackageCheck className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* نموذج إضافة قسم سريع */}
      <form onSubmit={handleCreateCategory} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-end gap-4 shadow-sm">
        <div className="w-full sm:flex-1">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
            <FolderPlus className="w-4 h-4 text-amber-600" />
            <span>اسم القسم الجديد</span>
          </label>
          <input name="name" required placeholder="ملابس شتوية" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
        </div>
        <div className="w-full sm:flex-1">
          <label className="block text-xs font-bold text-gray-700 mb-2">الرابط المختصر (Slug)</label>
          <input name="slug" required placeholder="winter-wear" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
        </div>
        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition whitespace-nowrap shadow-sm">
          إضافة قسم
        </button>
      </form>

      {/* نموذج إضافة منتج جديد */}
      <form onSubmit={handleCreateProduct} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
          <Plus className="w-5 h-5 text-amber-600" />
          <span>إضافة منتج جديد مع رصيد المخزون الافتتاحي</span>
        </h2>

        {/* الحقول الأساسية - شبكة منسقة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* الصف الأول */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم المنتج *</label>
            <input name="title" required placeholder="مثال: هودي قطن مصري ثقيل" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">الرابط المختصر (Slug) *</label>
            <input name="slug" required placeholder="heavy-cotton-hoodie" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>

          {/* الصف الثاني */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">سعر البيع (ج.م) *</label>
            <input name="base_price" type="number" step="0.01" required placeholder="650" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">سعر التكلفة (ج.م)</label>
            <input name="cost_price" type="number" step="0.01" placeholder="350" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">الكمية المتاحة *</label>
            <input name="stock_quantity" type="number" min={0} defaultValue={15} required className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">القسم</label>
            <select name="category_id" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors">
              <option value="">-- بدون قسم --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* الصف الثالث */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">المقاس *</label>
            <input name="size" required placeholder="L" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">اللون *</label>
            <input name="color" required placeholder="أسود" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">كود المخزن (SKU) *</label>
            <input name="sku" required placeholder="HD-BLK-L" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
        </div>

        {/* الوصف والصور */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">وصف المنتج (اختياري)</label>
            <textarea name="description" rows={3} placeholder="خامة قطن مصري 100% معالجة ضد الانكماش..." className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">صور المنتج (يمكنك اختيار أكثر من صورة)</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-center w-full h-20 px-4 transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-amber-50 hover:border-amber-400 focus:outline-none">
                <UploadCloud className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-600">اضغط هنا لاختيار صور من جهازك</span>
                <input type="file" name="image_files" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button type="submit" disabled={loading} className="px-10 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold transition shadow-sm">
            {loading ? "جاري الحفظ..." : "حفظ المنتج"}
          </button>
        </div>
      </form>

      {/* قائمة المنتجات والمتغيرات وتعديل المخزون */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">المنتجات المسجلة وإدارة المخزون اللحظي</h2>

        <div className="space-y-6">
          {products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد منتجات مضافة بعد.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{product.title}</h3>
                    <p className="text-xs text-gray-600 font-medium">
                      سعر البيع: {Number(product.base_price).toLocaleString("ar-EG")} ج.م
                      {product.cost_price > 0 && ` | التكلفة: ${Number(product.cost_price).toLocaleString("ar-EG")} ج.م`}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${product.is_active ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-200 text-gray-600"}`}>
                    {product.is_active ? "نشط في المتجر" : "مخفي"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(product.product_variants ?? []).map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-800">المقاس: {v.size} | اللون: {v.color}</p>
                        <p className="text-gray-500 font-mono">SKU: {v.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} value={stockEdits[v.id] ?? v.stock_quantity} onChange={(e) => setStockEdits((prev) => ({ ...prev, [v.id]: parseInt(e.target.value || "0", 10) }))} className="w-20 rounded-lg bg-gray-50 border border-gray-300 px-2.5 py-1.5 text-center text-sm font-bold text-gray-900 focus:border-amber-500 focus:outline-none" />
                        <button type="button" disabled={loading} onClick={() => handleUpdateStock(v.id, v.stock_quantity)} className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 transition shadow-sm" title="حفظ الكمية">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddVariant} className="pt-3 border-t border-gray-200 flex flex-wrap items-end gap-3 bg-gray-100/50 p-3 rounded-xl">
                  <input type="hidden" name="product_id" value={product.id} />
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">مقاس جديد</label>
                    <input name="size" required placeholder="XL" className="w-20 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">اللون</label>
                    <input name="color" required placeholder="أبيض" className="w-24 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">كود SKU</label>
                    <input name="sku" required placeholder="HD-WHT-XL" className="w-28 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">الكمية</label>
                    <input name="stock_quantity" type="number" min={0} defaultValue={10} required className="w-20 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <button type="submit" disabled={loading} className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-xs font-bold text-white transition shadow-sm">
                    + إضافة مقاس
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}