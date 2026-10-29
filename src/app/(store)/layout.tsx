import React, { Suspense } from "react";
import {
  getStoreSettings,
  getPublishedCategories,
} from "@/lib/services/catalog.service";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getStoreSettings(),
    getPublishedCategories(),
  ]);

  const dynamicBrandStyle = {
    "--color-brand-primary": settings.primary_color_rgb,
    "--color-brand-secondary": settings.secondary_color_rgb,
    "--color-brand-accent": settings.accent_color_rgb,
  } as React.CSSProperties;

  return (
    <div style={dynamicBrandStyle} className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-24 bg-white border-b" />}>
        <Header
          storeName={settings.store_name}
          logoUrl={settings.logo_url}
          freeShippingThreshold={settings.free_shipping_threshold}
          categories={categories}
        />
      </Suspense>

      <main className="flex-1">{children}</main>

      <Footer
        storeName={settings.store_name}
        tagline={settings.store_tagline}
        supportPhone={settings.support_phone}
        supportEmail={settings.support_email}
        addressText={settings.address_text}
        categories={categories}
      />
    </div>
  );
}