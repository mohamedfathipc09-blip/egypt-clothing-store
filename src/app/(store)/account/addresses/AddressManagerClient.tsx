"use client";

import React, { useState } from "react";
import { Plus, MapPin, Phone, Trash2, Pencil, X, CheckCircle2 } from "lucide-react";
import { saveAddressAction, deleteAddressAction } from "../address-actions";

export default function AddressManagerClient({ initialAddresses }: { initialAddresses: any[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function openCreateModal() {
    setEditingAddress(null);
    setIsModalOpen(true);
  }

  function openEditModal(address: any) {
    setEditingAddress(address);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    if (editingAddress) formData.append("id", editingAddress.id);

    const res = await saveAddressAction(formData);
    setIsSaving(false);

    if (res.success) {
      setMsg({ type: "success", text: "تم الحفظ بنجاح" });
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setMsg({ type: "error", text: res.error || "حدث خطأ" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العنوان؟")) return;
    const res = await deleteAddressAction(id);
    if (res.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(res.error);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-gray-900">عناوين التوصيل</h2>
          <p className="text-xs text-gray-500 mt-1">أضف عنوانك مرة واحدة واستخدمه في كل طلباتك</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          عنوان جديد
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">لا توجد عناوين محفوظة حالياً.</p>
          <button onClick={openCreateModal} className="text-amber-600 font-bold text-sm hover:underline">
            إضافة أول عنوان
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          {addresses.map((address) => (
            <div key={address.id} className={`p-5 rounded-2xl border-2 transition-all relative ${address.is_default ? 'border-amber-500 bg-amber-50/30' : 'border-gray-100 bg-white'}`}>
              {address.is_default && (
                <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> الافتراضي
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-gray-900 text-sm">{address.label}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{address.full_name}</p>
              <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                <Phone className="w-3 h-3" /> {address.phone}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                {address.governorate} - {address.city}<br />
                {address.street_address}
                {address.landmark && <><br /><span className="text-gray-400">علامة مميزة: {address.landmark}</span></>}
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button onClick={() => openEditModal(address)} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                  <Pencil className="w-3.5 h-3.5" /> تعديل
                </button>
                <button onClick={() => handleDelete(address.id)} className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:underline mr-auto">
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال الإضافة / التعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-xl font-extrabold text-gray-900">
                {editingAddress ? "تعديل العنوان" : "عنوان جديد"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {msg && msg.type === "error" && (
              <div className="p-3 bg-rose-50 text-rose-800 text-sm font-bold rounded-xl">{msg.text}</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">التسمية (المنزل، العمل)</label>
                  <input name="label" defaultValue={editingAddress?.label || "المنزل"} required className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الاسم بالكامل</label>
                  <input name="full_name" defaultValue={editingAddress?.full_name} required className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الموبايل</label>
                  <input type="tel" name="phone" defaultValue={editingAddress?.phone} required pattern="01[0-9]{9}" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المحافظة</label>
                  <input name="governorate" defaultValue={editingAddress?.governorate} required className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المدينة / المنطقة</label>
                  <input name="city" defaultValue={editingAddress?.city} required className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">علامة مميزة (اختياري)</label>
                  <input name="landmark" defaultValue={editingAddress?.landmark} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">العنوان بالتفصيل (الشارع، رقم العقار، الدور)</label>
                <textarea name="street_address" defaultValue={editingAddress?.street_address} required rows={2} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_default" defaultChecked={editingAddress?.is_default} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                <span className="text-sm text-gray-700 font-medium">اجعله العنوان الافتراضي للطلبات</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">إلغاء</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50">
                  {isSaving ? "جاري الحفظ..." : "حفظ العنوان"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}