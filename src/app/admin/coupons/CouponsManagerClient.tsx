"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  X,
  Ticket,
  Copy,
  Save,
} from "lucide-react";
import { formatEGP } from "@/lib/utils/currency";
import {
  createCouponAction,
  updateCouponAction,
  toggleCouponActiveAction,
  deleteCouponAction,
} from "@/app/admin/coupon-actions";

type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderSubtotal: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISO(local: string): string {
  if (!local) return new Date().toISOString();
  return new Date(local).toISOString();
}

function getCouponState(c: Coupon): { label: string; color: string } {
  const now = new Date();
  if (!c.isActive) {
    return { label: "معطل", color: "bg-gray-50 text-gray-600 border-gray-200" };
  }
  if (new Date(c.startsAt) > now) {
    return { label: "لم يبدأ بعد", color: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (c.expiresAt && new Date(c.expiresAt) < now) {
    return { label: "منتهي", color: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) {
    return { label: "استُنفد", color: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { label: "نشط", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

const EMPTY_FORM = {
  code: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: 10,
  minOrderSubtotal: 0,
  maxDiscountAmount: "" as string | number,
  usageLimit: "" as string | number,
  startsAt: toLocalInput(new Date().toISOString()),
  expiresAt: "",
  isActive: true,
};

export default function CouponsManagerClient({
  initialCoupons,
}: {
  initialCoupons: Coupon[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((c) => c.code.toLowerCase().includes(q));
  }, [coupons, searchTerm]);

  const stats = useMemo(() => {
    const now = new Date();
    let active = 0;
    let expired = 0;
    let totalUses = 0;
    for (const c of coupons) {
      if (c.isActive && (!c.expiresAt || new Date(c.expiresAt) >= now)) active++;
      if (c.expiresAt && new Date(c.expiresAt) < now) expired++;
      totalUses += c.usedCount;
    }
    return { total: coupons.length, active, expired, totalUses };
  }, [coupons]);

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setIsModalOpen(true);
  }

  function openEditModal(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderSubtotal: c.minOrderSubtotal,
      maxDiscountAmount: c.maxDiscountAmount ?? "",
      usageLimit: c.usageLimit ?? "",
      startsAt: toLocalInput(c.startsAt),
      expiresAt: toLocalInput(c.expiresAt),
      isActive: c.isActive,
    });
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload = {
      code: form.code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderSubtotal: Number(form.minOrderSubtotal),
      maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      startsAt: toISO(form.startsAt),
      expiresAt: form.expiresAt ? toISO(form.expiresAt) : null,
      isActive: form.isActive,
    };

    const res = editingId
      ? await updateCouponAction(editingId, payload)
      : await createCouponAction(payload);

    setIsSaving(false);

    if (res.success) {
      setFeedback({
        type: "success",
        text: editingId ? "تم تحديث الكوبون." : "تم إنشاء الكوبون.",
      });
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setFeedback({ type: "error", text: res.error || "حدث خطأ." });
    }
  }

  async function handleToggle(c: Coupon) {
    setLoadingId(c.id);
    setFeedback(null);
    const res = await toggleCouponActiveAction(c.id, !c.isActive);
    setLoadingId(null);
    if (res.success) {
      setCoupons((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x))
      );
      setFeedback({
        type: "success",
        text: c.isActive ? "تم تعطيل الكوبون." : "تم تفعيل الكوبون.",
      });
    } else {
      setFeedback({ type: "error", text: res.error || "فشل التحديث." });
    }
  }

  async function handleDelete(c: Coupon) {
    if (!confirm(`هل تريد حذف الكوبون "${c.code}"؟ لا يمكن التراجع.`)) return;
    setLoadingId(c.id);
    setFeedback(null);
    const res = await deleteCouponAction(c.id);
    setLoadingId(null);
    if (res.success) {
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      setFeedback({ type: "success", text: "تم حذف الكوبون." });
    } else {
      setFeedback({ type: "error", text: res.error || "فشل الحذف." });
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setFeedback({ type: "success", text: `تم نسخ الكود: ${code}` });
  }

  const inputClass =
    "w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-amber-600" />
            إدارة كوبونات الخصم
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ أكواد خصم تلقائية أو محدودة — تُطبَّق تلقائيًا في صفحة الدفع
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>كوبون جديد</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-500 hover:text-gray-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="إجمالي الكوبونات" value={stats.total} color="text-gray-900" />
        <StatCard label="نشطة الآن" value={stats.active} color="text-emerald-600" />
        <StatCard label="منتهية" value={stats.expired} color="text-rose-600" />
        <StatCard label="إجمالي الاستخدامات" value={stats.totalUses} color="text-amber-600" />
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 ps-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs text-gray-600 font-bold">
                <th className="p-4">الكود</th>
                <th className="p-4">الخصم</th>
                <th className="p-4">الحد الأدنى</th>
                <th className="p-4">الاستخدامات</th>
                <th className="p-4">الفترة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    لا توجد كوبونات.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const state = getCouponState(c);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50/50 transition ${
                        loadingId === c.id ? "opacity-50" : ""
                      }`}
                    >
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => copyCode(c.code)}
                          className="font-mono font-bold text-amber-600 hover:text-amber-700 flex items-center gap-2 group"
                          title="نسخ الكود"
                        >
                          <span>{c.code}</span>
                          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-900">
                          {c.discountType === "percentage"
                            ? `${c.discountValue}%`
                            : formatEGP(c.discountValue)}
                        </span>
                        {c.discountType === "percentage" && c.maxDiscountAmount && (
                          <div className="text-[10px] text-gray-500">
                            حتى {formatEGP(c.maxDiscountAmount)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-gray-700 text-xs">
                        {c.minOrderSubtotal > 0 ? formatEGP(c.minOrderSubtotal) : "بدون حد"}
                      </td>
                      <td className="p-4">
                        <div className="text-gray-900 font-bold">
                          {c.usedCount}
                          {c.usageLimit !== null && (
                            <span className="text-gray-500 font-normal">
                              {" "}/ {c.usageLimit}
                            </span>
                          )}
                        </div>
                        {c.usageLimit !== null && (
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{
                                width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        <div>من: {new Date(c.startsAt).toLocaleDateString("ar-EG")}</div>
                        {c.expiresAt && (
                          <div>إلى: {new Date(c.expiresAt).toLocaleDateString("ar-EG")}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${state.color}`}
                        >
                          {state.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            title="تعديل"
                            className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(c)}
                            disabled={loadingId === c.id}
                            title={c.isActive ? "تعطيل" : "تفعيل"}
                            className={`p-2 rounded-xl border transition ${
                              c.isActive
                                ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {c.isActive ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            disabled={loadingId === c.id}
                            title="حذف"
                            className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-600" />
                {editingId ? "تعديل كوبون" : "كوبون جديد"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الكود (حروف إنجليزية، أرقام، _، -) *
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="مثال: WELCOME10"
                  className={`${inputClass} font-mono tracking-wider`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نوع الخصم</label>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className={inputClass}
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">القيمة *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    max={form.discountType === "percentage" ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({ ...form, discountValue: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الحد الأدنى للطلب</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderSubtotal}
                    onChange={(e) =>
                      setForm({ ...form, minOrderSubtotal: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">أقصى خصم (اختياري)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscountAmount}
                    onChange={(e) =>
                      setForm({ ...form, maxDiscountAmount: e.target.value })
                    }
                    placeholder="اتركه فارغًا"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">حد الاستخدام (اختياري)</label>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="بلا حد — اتركه فارغًا"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ البدء *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-600"
                />
                <span className="font-medium">مفعّل فورًا</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إنشاء الكوبون"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] text-gray-500 mb-1 font-medium">{label}</p>
      <p className={`text-lg font-extrabold ${color}`}>{value}</p>
    </div>
  );
}