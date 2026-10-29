export type AdminRole =
  | "owner"
  | "admin"
  | "inventory_manager"
  | "order_manager"
  | "viewer";

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "failed_delivery";

export type PaymentStatus = "uncollected" | "collected" | "refunded" | "cancelled";

export type OutboxStatus =
  | "pending_configuration"
  | "queued"
  | "processing"
  | "sent"
  | "failed"
  | "dead_letter";

export interface StoreSettings {
  id: number;
  store_name: string;
  store_tagline: string;
  logo_url: string | null;
  primary_color_rgb: string;
  secondary_color_rgb: string;
  accent_color_rgb: string;
  support_phone: string;
  support_whatsapp: string;
  support_email: string;
  address_text: string;
  free_shipping_threshold: number | null;
  return_window_days: number;
}

export interface ShippingZone {
  id: string;
  governorate_code: string;
  governorate_name: string;
  customer_shipping_fee: number;
  store_actual_shipping_cost: number;
  estimated_delivery_days: string;
  is_active: boolean;
}

export interface ProductVariantWithStock {
  id: string;
  product_id: string;
  sku: string;
  selling_price: number;
  compare_at_price: number | null;
  current_unit_cost: number | null;
  low_stock_threshold: number;
  is_active: boolean;
  size: { id: string; code: string; name_ar: string };
  color: { id: string; code: string; name_ar: string; hex_code: string };
  inventory: {
    physical_qty: number;
    reserved_qty: number;
    available_qty: number;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean;
}

export interface AdminVariantItem {
  id: string;
  product_id?: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
  selling_price?: number | null;
}

export interface AdminProductItem {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  is_active: boolean;
  category_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  product_variants?: AdminVariantItem[];
}

export interface AdminCouponItem {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number;
  min_order_amount?: number;
  is_active?: boolean;
}

export interface AdminShippingZoneItem {
  id: string;
  governorate_name: string;
  shipping_fee: number;
  estimated_days: string;
  is_active?: boolean;
}