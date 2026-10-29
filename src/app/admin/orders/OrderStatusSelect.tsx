"use client";

import React, { useState, useTransition } from "react";
import { updateOrderStatusAdvancedAction } from "../actions";
import { Loader2, ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "قيد المراجعة", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "confirmed", label: "تم التأكيد", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "processing", label: "قيد التجهيز", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "shipped", label: "تم الشحن", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "delivered", label: "تم التوصيل", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "cancelled", label: "ملغي", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "returned", label: "مرتجع", color: "bg-gray-50 text-gray-700 border-gray-200" },
] as const;

const DEFAULT_STATUS = {
  value: "pending",
  label: "قيد المراجعة",
  color: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    const previousStatus = status;
    setStatus(newStatus);
    setError(null);

    startTransition(async () => {
      // بناءً على الكود اللي شفته في الـ actions، الدالة دي بتاخد orderId و newStatus مباشرة
       const res = await updateOrderStatusAdvancedAction(orderId, newStatus);
       if (!res.success) {
       alert(res.error || "حدث خطأ أثناء تغيير الحالة");
      }
    });
  }

  const currentOption =
    STATUS_OPTIONS.find((s) => s.value === status) ?? DEFAULT_STATUS;

  return (
    <div className="inline-flex flex-col gap-1 w-full min-w-[160px]">
      <div className="relative w-full">
        <select
          value={status}
          onChange={handleChange}
          disabled={isPending}
          className={`appearance-none w-full px-3.5 py-2 pr-9 rounded-xl text-xs font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${currentOption.color} ${isPending ? "opacity-60" : ""}`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          )}
        </div>
      </div>
      {error && (
        <p className="text-[10px] text-rose-600 font-medium">{error}</p>
      )}
    </div>
  );
}