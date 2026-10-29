"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition print:hidden"
    >
      <Printer className="w-4 h-4" />
      <span>طباعة بوليصة الشحن</span>
    </button>
  );
}