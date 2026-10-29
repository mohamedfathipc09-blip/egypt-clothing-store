"use client";

import React, { useState } from "react";
import {
  createCategoryAction,
  createProductWithVariantAction,
  addVariantToProductAction,
  updateVariantStockAction,
} from "@/app/admin/actions";
import { Plus, Save, PackageCheck, AlertCircle, FolderPlus } from "lucide-react";

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
    <div className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-medium ${
            message.type === "ok"
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
              : "bg-red-950/70 border-red-800 text-red-200"
          }`}
        >
          {message.type === "ok" ? (
            <PackageCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* نموذج إضافة قسم سريع */}
      <form
        onSubmit={handleCreateCategory}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row items-end gap-4"
      >
        <div className="w-full sm:flex-1">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <FolderPlus className="w-4 h-4 text-amber-500" />
            <span>اسم القسم الجديد (مثال: رجالي، حريمي، شتوي)</span>
          </label>
          <input
            name="name"
            required
            placeholder="ملابس شتوية"
            className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
          />
        </div>
        <div className="w-full sm:flex-1">
          <label className="block text-xs text-gray-400 mb-1">الرابط المختصر للقسم (Slug)</label>
          <input
            name="slug"
            required
            placeholder="winter-wear"
            className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition whitespace-nowrap"
        >
          إضافة قسم
        </button>
      </form>

      {/* نموذج إضافة منتج جديد */}
      <form
        onSubmit={handleCreateProduct}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-500" />
          <span>إضافة منتج جديد مع رصيد المخزون الافتتاحي</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">اسم المنتج *</label>
            <input
              name="title"
              required
              placeholder="مثال: هودي قطن مصري ثقيل"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">الرابط المختصر (Slug) *</label>
            <input
              name="slug"
              required
              placeholder="heavy-cotton-hoodie"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">السعر (ج.م) *</label>
            <input
              name="base_price"
              type="number"
              step="0.01"
              required
              placeholder="650"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">القسم</label>
            <select
              name="category_id"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            >
              <option value="">-- بدون قسم --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">المقاس *</label>
            <input
              name="size"
              required
              placeholder="L"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">اللون *</label>
            <input
              name="color"
              required
              placeholder="أسود"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">كود المخزن (SKU) *</label>
            <input
              name="sku"
              required
              placeholder="HD-BLK-L"
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">الكمية المتاحة *</label>
            <input
              name="stock_quantity"
              type="number"
              min={0}
              defaultValue={15}
              required
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">وصف المنتج (اختياري)</label>
            <input
              name="description"
              placeholder="خامة قطن مصري 100% معالجة ضد الانكماش..."
              className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">رابط صورة المنتج (اختياري)</label>
              <input
                name="image_url"
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3.5 py-2 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold transition whitespace-nowrap"
            >
              {loading ? "جاري الحفظ..." : "حفظ المنتج"}
            </button>
          </div>
        </div>
      </form>

      {/* قائمة المنتجات والمتغيرات وتعديل المخزون */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">المنتجات المسجلة وإدارة المخزون اللحظي</h2>

        <div className="space-y-6">
          {products.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد منتجات مضافة بعد.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="p-5 rounded-2xl bg-gray-950 border border-gray-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{product.title}</h3>
                    <p className="text-xs text-gray-400">
                      السعر الأساسي: {Number(product.base_price).toLocaleString("ar-EG")} ج.م
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      product.is_active
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {product.is_active ? "نشط في المتجر" : "مخفي"}
                  </span>
                </div>

                {/* المتغيرات الحالية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(product.product_variants ?? []).map((v: any) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between bg-gray-900 border border-gray-800/80 rounded-xl px-3.5 py-2.5"
                    >
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-gray-200">
                          المقاس: {v.size} | اللون: {v.color}
                        </p>
                        <p className="text-gray-500 font-mono">SKU: {v.sku}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={stockEdits[v.id] ?? v.stock_quantity}
                          onChange={(e) =>
                            setStockEdits((prev) => ({
                              ...prev,
                              [v.id]: parseInt(e.target.value || "0", 10),
                            }))
                          }
                          className="w-20 rounded-lg bg-gray-950 border border-gray-700 px-2.5 py-1 text-center text-sm font-bold text-white"
                        />
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleUpdateStock(v.id, v.stock_quantity)}
                          className="p-2 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 transition"
                          title="حفظ الكمية الجديدة"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* إضافة مقاس ولون إضافي لنفس المنتج */}
                <form
                  onSubmit={handleAddVariant}
                  className="pt-2 border-t border-gray-900 flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="product_id" value={product.id} />
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">مقاس جديد</label>
                    <input
                      name="size"
                      required
                      placeholder="XL"
                      className="w-20 rounded-lg bg-gray-900 border border-gray-800 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">اللون</label>
                    <input
                      name="color"
                      required
                      placeholder="أبيض"
                      className="w-24 rounded-lg bg-gray-900 border border-gray-800 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">كود SKU</label>
                    <input
                      name="sku"
                      required
                      placeholder="HD-WHT-XL"
                      className="w-28 rounded-lg bg-gray-900 border border-gray-800 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">الكمية</label>
                    <input
                      name="stock_quantity"
                      type="number"
                      min={0}
                      defaultValue={10}
                      required
                      className="w-20 rounded-lg bg-gray-900 border border-gray-800 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-amber-600 text-xs font-bold text-gray-200 hover:text-white transition"
                  >
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