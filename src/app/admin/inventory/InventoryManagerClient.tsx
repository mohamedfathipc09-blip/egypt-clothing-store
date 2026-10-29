"use client";

import React, { useState, useMemo } from "react";
import {
  Search, Package, AlertTriangle, PackageX, PackageCheck,
  Plus, Minus, CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { formatEGP } from "@/lib/utils/currency";
import {
  updateInventoryQuantityAction,
  adjustInventoryQuantityAction,
  updateReorderThresholdAction,
} from "@/app/admin/inventory-actions";

type Filter = "all" | "low" | "out" | "available";

export default function InventoryManagerClient({
  variants,
}: {
  variants: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [thresholdValue, setThresholdValue] = useState(5);
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);

  const stats = useMemo(() => {
    const totalVariants = variants.length;
    const totalPhysical = variants.reduce((sum, v) => sum + v.physical_qty, 0);
    const totalReserved = variants.reduce((sum, v) => sum + v.reserved_qty, 0);
    const totalAvailable = variants.reduce((sum, v) => sum + v.available_qty, 0);
    const totalInventoryValue = variants.reduce(
      (sum, v) => sum + v.physical_qty * v.cost_price, 0
    );
    const lowStock = variants.filter(
      (v) => v.available_qty > 0 && v.available_qty <= v.reorder_threshold
    ).length;
    const outOfStock = variants.filter((v) => v.available_qty <= 0).length;

    return {
      totalVariants, totalPhysical, totalReserved, totalAvailable,
      totalInventoryValue, lowStock, outOfStock,
    };
  }, [variants]);

  const filteredVariants = useMemo(() => {
    return variants
      .filter((v) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
          v.product_title.toLowerCase().includes(term) ||
          v.sku.toLowerCase().includes(term) ||
          v.size.toLowerCase().includes(term) ||
          v.color.toLowerCase().includes(term)
        );
      })
      .filter((v) => {
        if (filter === "low")
          return v.available_qty > 0 && v.available_qty <= v.reorder_threshold;
        if (filter === "out") return v.available_qty <= 0;
        if (filter === "available") return v.available_qty > 0;
        return true;
      });
  }, [variants, searchTerm, filter]);

  async function handleInlineQtyUpdate(variantId: string, newQty: number) {
    if (Number.isNaN(newQty) || newQty < 0) return;
    setLoadingId(variantId);
    setFeedback(null);
    const res = await updateInventoryQuantityAction({
      variantId,
      physicalQty: newQty,
    });
    setLoadingId(null);
    if (res.success) {
      setFeedback({ type: "success", text: "تم تحديث الكمية بنجاح." });
    } else {
      setFeedback({ type: "error", text: res.error || "فشل تحديث الكمية." });
    }
  }

  async function handleQuickAdjust(variantId: string, delta: number) {
    setLoadingId(variantId);
    setFeedback(null);
    const res = await adjustInventoryQuantityAction({ variantId, delta });
    setLoadingId(null);
    if (res.success) {
      setFeedback({
        type: "success",
        text: `تم التعديل — الكمية الجديدة: ${res.newQty}`,
      });
    } else {
      setFeedback({ type: "error", text: res.error || "فشل التعديل." });
    }
  }

  function openThresholdModal(variant: any) {
    setSelectedVariant(variant);
    setThresholdValue(variant.reorder_threshold);
  }

  async function handleSaveThreshold(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVariant) return;
    setIsSavingThreshold(true);
    const res = await updateReorderThresholdAction({
      variantId: selectedVariant.id,
      threshold: thresholdValue,
    });
    setIsSavingThreshold(false);
    if (res.success) {
      setFeedback({ type: "success", text: "تم تحديث حد التنبيه." });
      setSelectedVariant(null);
    } else {
      setFeedback({ type: "error", text: res.error || "فشل الحفظ." });
    }
  }

  function stockBadge(v: any) {
    if (v.available_qty <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <PackageX className="w-3 h-3" />
          نافد
        </span>
      );
    }
    if (v.available_qty <= v.reorder_threshold) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          منخفض
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <PackageCheck className="w-3 h-3" />
        متاح
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-amber-600" />
          إدارة المخزون
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          متابعة وتحديث كميات كل مقاس/لون في المتجر
        </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="إجمالي المتغيرات" value={stats.totalVariants} color="text-gray-900" />
        <StatCard label="إجمالي القطع" value={stats.totalPhysical} color="text-gray-900" />
        <StatCard label="المحجوز" value={stats.totalReserved} color="text-amber-600" />
        <StatCard label="المتاح للبيع" value={stats.totalAvailable} color="text-emerald-600" />
        <StatCard label="قيمة المخزون" value={formatEGP(stats.totalInventoryValue)} color="text-sky-600" small />
        <StatCard
          label="تحت التنبيه"
          value={`${stats.lowStock} منخفض / ${stats.outOfStock} نافد`}
          color={stats.lowStock + stats.outOfStock > 0 ? "text-rose-600" : "text-gray-900"}
          small
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، SKU، المقاس، أو اللون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 ps-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "available", "low", "out"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                filter === f
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "الكل" : f === "available" ? "متاح" : f === "low" ? "منخفض" : "نافد"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs text-gray-600 font-bold">
                <th className="p-4">المنتج</th>
                <th className="p-4">المقاس / اللون</th>
                <th className="p-4">SKU</th>
                <th className="p-4">الكمية الفعلية</th>
                <th className="p-4">المحجوز</th>
                <th className="p-4">المتاح</th>
                <th className="p-4">حد التنبيه</th>
                <th className="p-4">القيمة</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    لا توجد متغيرات مطابقة.
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => (
                  <tr
                    key={v.id}
                    className={`hover:bg-gray-50/50 transition ${
                      loadingId === v.id ? "opacity-50" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                          {v.product_image ? (
                            <img
                              src={v.product_image}
                              alt={v.product_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                              بدون
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-gray-900 line-clamp-1">
                          {v.product_title}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs">
                          {v.size || "—"}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs">
                          {v.color || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {v.sku}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(v.id, -1)}
                          disabled={loadingId === v.id || v.physical_qty <= 0}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition"
                          title="إنقاص 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          defaultValue={v.physical_qty}
                          className="w-16 bg-white text-center font-bold rounded px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                          onBlur={async (e) => {
                            const newQty = Number(e.target.value);
                            if (!Number.isNaN(newQty) && newQty !== v.physical_qty) {
                              await handleInlineQtyUpdate(v.id, newQty);
                            }
                          }}
                          title="اضغط خارج الحقل للحفظ"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(v.id, 1)}
                          disabled={loadingId === v.id}
                          className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-30 transition"
                          title="زيادة 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-amber-600 font-bold">
                      {v.reserved_qty}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {v.available_qty}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => openThresholdModal(v)}
                        className="text-xs text-blue-600 underline decoration-dotted hover:text-blue-700"
                      >
                        {v.reorder_threshold} — تعديل
                      </button>
                    </td>
                    <td className="p-4 text-xs text-gray-500 font-mono">
                      {formatEGP(v.physical_qty * v.cost_price)}
                    </td>
                    <td className="p-4">{stockBadge(v)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                حد التنبيه — {selectedVariant.product_title}
              </h3>
              <button onClick={() => setSelectedVariant(null)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveThreshold} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ينبّهك عندما تصبح الكمية أقل من أو تساوي:
                </label>
                <input
                  type="number"
                  min="0"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(Number(e.target.value))}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingThreshold}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition disabled:opacity-50"
                >
                  {isSavingThreshold ? "جاري الحفظ..." : "حفظ"}
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
  label, value, color, small,
}: {
  label: string;
  value: any;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] text-gray-500 mb-1 font-medium">{label}</p>
      <p className={`${small ? "text-sm" : "text-lg"} font-extrabold ${color}`}>
        {value}
      </p>
    </div>
  );
}