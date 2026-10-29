"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export default function ExportOrdersButton({
  statusFilter,
  label = "تصدير إلى Excel",
}: {
  statusFilter?: string;
  label?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  function handleExport() {
    setIsExporting(true);
    const url = new URL("/api/export/orders", window.location.origin);
    if (statusFilter && statusFilter !== "all") {
      url.searchParams.set("status", statusFilter);
    }

    const link = document.createElement("a");
    link.href = url.toString();
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      <span>{isExporting ? "جاري التصدير..." : label}</span>
    </button>
  );
}