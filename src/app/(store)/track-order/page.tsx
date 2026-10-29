import React, { Suspense } from "react";
import TrackOrderClient from "@/components/store/TrackOrderClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          }
        >
          <TrackOrderClient />
        </Suspense>
      </div>
    </div>
  );
}