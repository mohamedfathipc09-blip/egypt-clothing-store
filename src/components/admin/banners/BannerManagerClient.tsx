"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  Trash2,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import {
  saveBannerAction,
  deleteBannerAction,
  toggleBannerAction,
} from "@/app/admin/banner-actions";

export default function BannerManagerClient({
  initialBanners,
}: {
  initialBanners: any[];
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);
    const formData = new FormData(e.currentTarget);

    const isChecked = formData.get("is_active") === "on";
    formData.set("is_active", isChecked ? "true" : "false");

    if (editingBanner) formData.append("id", editingBanner.id);

    try {
      const res = await saveBannerAction(formData);
      if (res.success) {
        setMsg({ type: "success", text: "تم الحفظ بنجاح." });
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setMsg({ type: "error", text: res.error || "حدث خطأ." });
      }
    } catch (error) {
      setMsg({
        type: "error",
        text: "فشل الاتصال بالسيرفر. تأكد من أن حجم الصورة أقل من 10 ميجابايت.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا البانر؟")) return;
    await deleteBannerAction(id);
    setBanners(banners.filter((b) => b.id !== id));
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    await toggleBannerAction(id, !currentStatus);
    setBanners(
      banners.map((b) =>
        b.id === id ? { ...b, is_active: !currentStatus } : b
      )
    );
  }

  const inputClass =
    "w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-600" />
            إدارة البانرات المتحركة
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أضف صوراً وعروضاً تظهر في أعلى الصفحة الرئيسية
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          بانر جديد
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {msg.text}
        </div>
      )}

      {/* Grid of Banners */}
      {banners.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            لا توجد بانرات بعد
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            أضف أول بانر لعرضه في أعلى الصفحة الرئيسية
          </p>
          <button
            onClick={() => {
              setEditingBanner(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة بانر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${
                banner.is_active
                  ? "border-emerald-200"
                  : "border-gray-200 opacity-70"
              }`}
            >
              <div className="relative">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 end-2">
                  {banner.is_active ? (
                    <span className="px-2 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-bold shadow-sm">
                      نشط
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-md bg-gray-500 text-white text-[10px] font-bold shadow-sm">
                      معطل
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-gray-900 line-clamp-1">
                  {banner.title || "بدون عنوان"}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {banner.subtitle || "بدون وصف"}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggle(banner.id, banner.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      banner.is_active
                        ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                        : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                    }`}
                    title={banner.is_active ? "إخفاء البانر" : "تفعيل البانر"}
                  >
                    {banner.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingBanner(banner);
                      setIsModalOpen(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline px-2"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                    title="حذف البانر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingBanner ? "تعديل البانر" : "إضافة بانر جديد"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {editingBanner && (
                <input
                  type="hidden"
                  name="current_image_url"
                  value={editingBanner.image_url}
                />
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  صورة البانر (يفضل 1920x600) *
                </label>
                <input
                  type="file"
                  name="image_file"
                  accept="image/*"
                  required={!editingBanner}
                  className="w-full text-sm text-gray-700 file:bg-amber-600 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:me-3 file:font-semibold file:cursor-pointer hover:file:bg-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">
                    العنوان
                  </label>
                  <input
                    name="title"
                    defaultValue={editingBanner?.title}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">
                    العنوان الفرعي
                  </label>
                  <input
                    name="subtitle"
                    defaultValue={editingBanner?.subtitle}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">
                    نص الزر (CTA)
                  </label>
                  <input
                    name="cta_text"
                    defaultValue={editingBanner?.cta_text}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">
                    رابط الزر
                  </label>
                  <input
                    name="cta_link"
                    defaultValue={editingBanner?.cta_link}
                    placeholder="/products"
                    className={`${inputClass} text-left`}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={editingBanner?.display_order || 0}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    defaultChecked={
                      editingBanner ? editingBanner.is_active : true
                    }
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-bold text-gray-700 cursor-pointer"
                  >
                    مفعل ونشط في المتجر
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}