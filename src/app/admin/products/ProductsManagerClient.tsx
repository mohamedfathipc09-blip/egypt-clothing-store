"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createCategoryAction,
  createProductWithVariantAction,
  addVariantToProductAction,
  updateVariantStockAction,
  deleteOrArchiveProductAction,
  toggleProductPublishAction,
} from "@/app/admin/actions";
import { 
  Plus, Save, PackageCheck, AlertCircle, FolderPlus, UploadCloud, X, 
  Search, Edit, Trash2, Eye, EyeOff, Package
} from "lucide-react";

export default function ProductsManagerClient({
  products,
  categories,
}: {
  products: any[];
  categories: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  
  // States for Form
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // States for Table
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
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
    
    const formData = new FormData(form);
    formData.delete("image_files"); 
    selectedFiles.forEach((file) => formData.append("image_files", file));

    try {
      const res = await createProductWithVariantAction(formData);
      if (!res.success) {
        setMessage({ type: "err", text: res.error || "خطأ أثناء الإضافة" });
      } else {
        setMessage({ type: "ok", text: "تمت إضافة المنتج والمخزون الافتتاحي بنجاح!" });
        form.reset();
        setSelectedFiles([]);
        setImagePreviews([]);
        setShowForm(false);
        router.refresh();
      }
    } catch (error) {
      setMessage({ type: "err", text: "حدث خطأ في الاتصال، تأكد من حجم الصور." });
    } finally {
      setLoading(false);
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
      router.refresh();
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
      setMessage({ type: "ok", text: "تم تحديث كمية المخزون بنجاح!" });
      router.refresh();
    }
  }

  // ✅ دوال التحكم في المنتجات (حذف - إخفاء/نشر)
  async function handleTogglePublish(productId: string, currentStatus: boolean) {
    if (!confirm("هل أنت متأكد من تغيير حالة نشر هذا المنتج؟")) return;
    setActionLoadingId(productId);
    const res = await toggleProductPublishAction(productId, !currentStatus);
    setActionLoadingId(null);
    
    if (!res.success) alert(res.error);
    else router.refresh();
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm("تحذير: هل أنت متأكد من حذف هذا المنتج نهائياً؟ (إذا كان عليه طلبات سابقة سيتم أخفاؤه فقط)")) return;
    setActionLoadingId(productId);
    const res = await deleteOrArchiveProductAction(productId);
    setActionLoadingId(null);
    
    if (!res.success) alert(res.error);
    else router.refresh();
  }

  // تصفية المنتجات بناءً على البحث
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.product_variants?.[0]?.sku && p.product_variants[0].sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-gray-900 bg-white min-h-screen p-2 sm:p-6 w-full max-w-[1600px] mx-auto" dir="rtl">
      
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-bold shadow-sm ${message.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          {message.type === "ok" ? <PackageCheck className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="mr-auto text-gray-400 hover:text-gray-700"><X className="w-4 h-4"/></button>
        </div>
      )}

      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" /> إدارة المنتجات
          </h1>
          <p className="text-sm text-gray-500 mt-1">عرض، تعديل، وإدارة جميع منتجات متجرك.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition shadow-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "إلغاء الإضافة" : "إضافة منتج جديد"}
        </button>
      </div>

      {/* فورم الإضافة (يظهر ويختفي) */}
      {showForm && (
        <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
          {/* إضافة قسم سريع */}
          <form onSubmit={handleCreateCategory} className="bg-white border-2 border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row items-end gap-4 shadow-sm">
             <div className="w-full sm:flex-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5"><FolderPlus className="w-4 h-4 text-amber-600" /> اسم القسم الجديد</label>
              <input name="name" required placeholder="ملابس شتوية" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
            </div>
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">الرابط المختصر (Slug)</label>
              <input name="slug" required placeholder="winter-wear" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition">إضافة قسم</button>
          </form>

          {/* إضافة منتج جديد */}
          <form onSubmit={handleCreateProduct} className="bg-white border-2 border-amber-100 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b-2 border-gray-50 pb-4">
              <Plus className="w-5 h-5 text-amber-600" /> إضافة منتج جديد
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم المنتج *</label>
                <input name="title" required placeholder="مثال: هودي قطن" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">الرابط المختصر (Slug) *</label>
                <input name="slug" required placeholder="heavy-cotton-hoodie" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">سعر البيع *</label>
                <input name="base_price" type="number" step="0.01" required placeholder="650" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">سعر التكلفة</label>
                <input name="cost_price" type="number" step="0.01" placeholder="350" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">الكمية *</label>
                <input name="stock_quantity" type="number" min={0} defaultValue={15} required className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">القسم</label>
                <select name="category_id" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none">
                  <option value="">-- بدون قسم --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">المقاس *</label>
                <input name="size" required placeholder="L" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">اللون *</label>
                <input name="color" required placeholder="أسود" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">كود المخزن (SKU) *</label>
                <input name="sku" required placeholder="HD-BLK-L" className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">وصف المنتج</label>
                <textarea name="description" rows={3} placeholder="خامة قطن مصري 100%..." className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:bg-white outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">صور المنتج (اختياري)</label>
                <label className="flex flex-col items-center justify-center w-full h-20 transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-amber-50 hover:border-amber-400">
                  <UploadCloud className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-gray-600">اختر صور من جهازك</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition shadow-sm">
                {loading ? "جاري الحفظ..." : "حفظ المنتج"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* جدول المنتجات */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        
        {/* شريط البحث */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">قائمة المنتجات ({filteredProducts.length})</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الـ SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-4 pr-10 py-2 text-sm focus:border-amber-500 focus:outline-none bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs text-gray-600 font-bold">
                <th className="py-3 px-4">المنتج</th>
                <th className="py-3 px-4">السعر / التكلفة</th>
                <th className="py-3 px-4">المقاسات والألوان</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">لا توجد منتجات مطابقة للبحث.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${actionLoadingId === product.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* اسم وصورة المنتج */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400 m-auto mt-3" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.title}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{product.product_code || product.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* الأسعار */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-900 text-sm">{Number(product.base_price).toLocaleString("ar-EG")} ج.م</p>
                      {product.cost_price > 0 && <p className="text-xs text-gray-500 mt-0.5">التكلفة: {Number(product.cost_price).toLocaleString("ar-EG")} ج.م</p>}
                    </td>

                    {/* المتغيرات */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(product.product_variants ?? []).map((v: any) => (
                          <span key={v.id} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200" title={`SKU: ${v.sku} | المخزون: ${v.stock_quantity}`}>
                            {v.size} - {v.color} ({v.stock_quantity})
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* الحالة */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${product.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-300"}`}>
                        {product.is_active ? "نشط" : "مخفي"}
                      </span>
                    </td>

                    {/* الإجراءات (تعديل - إخفاء/نشر - حذف) */}
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* زر التعديل */}
                        <Link 
                          href={`/admin/products/${product.id}`} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                          title="تعديل المنتج"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* زر الإخفاء / النشر */}
                        <button 
                          onClick={() => handleTogglePublish(product.id, product.is_active)}
                          className={`p-2 rounded-lg transition ${product.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title={product.is_active ? "إخفاء المنتج" : "نشر المنتج"}
                        >
                          {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {/* زر الحذف */}
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition" 
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}