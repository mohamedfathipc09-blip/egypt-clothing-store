"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isWhatsAppConfigured } from "@/lib/env";
import { sendWhatsAppOrderNotification } from "@/lib/services/whatsapp.service";
import {
  checkoutSubmissionSchema,
  trackOrderSchema,
  type CheckoutSubmissionInput,
} from "@/lib/validations/checkout.schema";
import type { ShippingZone, OrderStatus, PaymentStatus } from "@/types/domain.types";

export interface ValidatedCartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  sizeName: string;
  colorName: string;
  unitSellingPrice: number;
  requestedQty: number;
  availableQty: number;
  isAvailable: boolean;
  lineSubtotal: number;
  stockWarning: string | null;
}

export interface CartValidationSummary {
  items: ValidatedCartItem[];
  subtotal: number;
  discountAmount: number;
  couponAppliedCode: string | null;
  couponError: string | null;
  shippingFee: number;
  freeShippingThreshold: number | null;
  totalAmount: number;
  hasStockIssues: boolean;
}

export async function getActiveShippingZonesAction(): Promise<ShippingZone[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("shipping_zones")
    .select(
      "id, governorate_code, governorate_name_ar, customer_shipping_fee, store_actual_shipping_cost, estimated_delivery_days, is_active"
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch shipping zones:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    governorate_code: String(row.governorate_code),
    governorate_name: String(row.governorate_name_ar),
    customer_shipping_fee: Number(row.customer_shipping_fee),
    store_actual_shipping_cost: Number(row.store_actual_shipping_cost),
    estimated_delivery_days: String(row.estimated_delivery_days),
    is_active: Boolean(row.is_active),
  }));
}

export async function validateCartOnServerAction(params: {
  items: Array<{ variantId: string; quantity: number }>;
  couponCode?: string;
  shippingZoneId?: string;
}): Promise<CartValidationSummary> {
  const supabase = createServerSupabaseClient();

  const { data: settingsData } = await supabase
    .from("store_settings")
    .select("free_shipping_threshold")
    .eq("id", 1)
    .single();

  const freeShippingThreshold =
    settingsData?.free_shipping_threshold !== null &&
    settingsData?.free_shipping_threshold !== undefined
      ? Number(settingsData.free_shipping_threshold)
      : null;

  if (!params.items || params.items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      discountAmount: 0,
      couponAppliedCode: null,
      couponError: null,
      shippingFee: 0,
      freeShippingThreshold,
      totalAmount: 0,
      hasStockIssues: false,
    };
  }

  const variantIds = params.items.map((i) => i.variantId);

  const { data: variantsData } = await supabase
    .from("product_variants")
    .select(
      `
      id, sku, selling_price, is_active, deleted_at,
      products ( id, name, slug, is_published, deleted_at ),
      sizes ( name_ar ),
      colors ( name_ar ),
      inventory_balances ( available_qty )
    `
    )
    .in("id", variantIds);

  const variantMap = new Map<string, Record<string, unknown>>();
  for (const row of (variantsData ?? []) as Array<Record<string, unknown>>) {
    variantMap.set(String(row.id), row);
  }

  const validatedItems: ValidatedCartItem[] = [];
  let subtotal = 0;
  let hasStockIssues = false;

  for (const reqItem of params.items) {
    const row = variantMap.get(reqItem.variantId);
    const qty = Math.max(1, Math.floor(Number(reqItem.quantity) || 1));

    if (!row) {
      hasStockIssues = true;
      validatedItems.push({
        variantId: reqItem.variantId,
        productId: "",
        productName: "منتج غير متاح",
        productSlug: "",
        sku: "-",
        sizeName: "-",
        colorName: "-",
        unitSellingPrice: 0,
        requestedQty: qty,
        availableQty: 0,
        isAvailable: false,
        lineSubtotal: 0,
        stockWarning: "هذا المنتج لم يعد متوفراً، يرجى حذفه من السلة.",
      });
      continue;
    }

    const prodObj = Array.isArray(row.products) ? row.products[0] : row.products;
    const sizeObj = Array.isArray(row.sizes) ? row.sizes[0] : row.sizes;
    const colorObj = Array.isArray(row.colors) ? row.colors[0] : row.colors;
    const balObj = Array.isArray(row.inventory_balances)
      ? row.inventory_balances[0]
      : row.inventory_balances;

    const isProductPublished =
      Boolean((prodObj as Record<string, unknown> | null)?.is_published) &&
      (prodObj as Record<string, unknown> | null)?.deleted_at === null;
    const isVariantActive = Boolean(row.is_active) && row.deleted_at === null;
    const availableQty = Number(
      (balObj as Record<string, unknown> | null)?.available_qty ?? 0
    );
    const unitPrice = Number(row.selling_price ?? 0);

    let stockWarning: string | null = null;
    let isAvailable = true;

    if (!isProductPublished || !isVariantActive || availableQty <= 0) {
      isAvailable = false;
      hasStockIssues = true;
      stockWarning = "نفدت هذه التركيبة من المخزون حالياً.";
    } else if (qty > availableQty) {
      isAvailable = false;
      hasStockIssues = true;
      stockWarning = `الكمية المتاحة حالياً في المخزن هي (${availableQty}) قطع فقط.`;
    }

    const lineSubtotal = isAvailable ? unitPrice * qty : 0;
    subtotal += lineSubtotal;

    validatedItems.push({
      variantId: String(row.id),
      productId: String((prodObj as Record<string, unknown> | null)?.id ?? ""),
      productName: String(
        (prodObj as Record<string, unknown> | null)?.name ?? "منتج"
      ),
      productSlug: String(
        (prodObj as Record<string, unknown> | null)?.slug ?? ""
      ),
      sku: String(row.sku),
      sizeName: String((sizeObj as Record<string, unknown> | null)?.name_ar ?? ""),
      colorName: String(
        (colorObj as Record<string, unknown> | null)?.name_ar ?? ""
      ),
      unitSellingPrice: unitPrice,
      requestedQty: qty,
      availableQty,
      isAvailable,
      lineSubtotal,
      stockWarning,
    });
  }

  let discountAmount = 0;
  let couponAppliedCode: string | null = null;
  let couponError: string | null = null;

  if (params.couponCode && params.couponCode.trim() !== "") {
    const cleanCode = params.couponCode.trim().toUpperCase();
    const serviceClient = createServiceRoleClient();
    const { data: coupon } = await serviceClient
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .single();

    const now = new Date();
    if (!coupon) {
      couponError = "كود الخصم غير صحيح أو غير مفعل.";
    } else if (
      new Date(String(coupon.starts_at)) > now ||
      (coupon.expires_at && new Date(String(coupon.expires_at)) < now)
    ) {
      couponError = "كود الخصم منتهي الصلاحية.";
    } else if (
      coupon.usage_limit !== null &&
      Number(coupon.used_count) >= Number(coupon.usage_limit)
    ) {
      couponError = "تم استنفاد الحد الأقصى لاستخدام هذا الكوبون.";
    } else if (subtotal < Number(coupon.min_order_subtotal)) {
      couponError = `الحد الأدنى لتفعيل هذا الكوبون هو ${Number(
        coupon.min_order_subtotal
      )} ج.م.`;
    } else {
      couponAppliedCode = cleanCode;
      if (coupon.discount_type === "percentage") {
        discountAmount = Math.round(
          (subtotal * Number(coupon.discount_value)) / 100
        );
        if (
          coupon.max_discount_amount !== null &&
          discountAmount > Number(coupon.max_discount_amount)
        ) {
          discountAmount = Number(coupon.max_discount_amount);
        }
      } else {
        discountAmount = Math.min(Number(coupon.discount_value), subtotal);
      }
    }
  }

  let shippingFee = 0;
  if (params.shippingZoneId) {
    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("customer_shipping_fee")
      .eq("id", params.shippingZoneId)
      .eq("is_active", true)
      .single();

    if (zone) {
      const netAfterDiscount = Math.max(0, subtotal - discountAmount);
      if (
        freeShippingThreshold !== null &&
        netAfterDiscount >= freeShippingThreshold
      ) {
        shippingFee = 0;
      } else {
        shippingFee = Number(zone.customer_shipping_fee);
      }
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount) + shippingFee;

  return {
    items: validatedItems,
    subtotal,
    discountAmount,
    couponAppliedCode,
    couponError,
    shippingFee,
    freeShippingThreshold,
    totalAmount,
    hasStockIssues,
  };
}

export async function submitOrderServerAction(
  input: CheckoutSubmissionInput
): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  trackingToken?: string;
  totalAmount?: number;
}> {
  const parsed = checkoutSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "بيانات الطلب غير مكتملة",
    };
  }

  const validData = parsed.data;
  const serviceClient = createServiceRoleClient();
  
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const rpcItems = validData.items.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
  }));

  const { data, error } = await serviceClient.rpc("create_order_atomic", {
    p_idempotency_key: validData.idempotencyKey,
    p_customer_name: validData.customerName,
    p_customer_phone: validData.customerPhone,
    p_shipping_zone_id: validData.shippingZoneId,
    p_city: validData.city,
    p_street_address: validData.streetAddress,
    p_landmark: validData.landmark || null,
    p_delivery_notes: validData.deliveryNotes || null,
    p_coupon_code: validData.couponCode || null,
    p_items: rpcItems,
    p_whatsapp_configured: isWhatsAppConfigured(),
    p_user_id: user?.id || null,
  });

  if (error || !data) {
    return {
      success: false,
      error:
        error?.message ||
        "تعذر إتمام الطلب، يرجى التحقق من الكميات المتاحة والمحاولة مرة أخرى.",
    };
  }

  // ✅ إصلاح undefined: Supabase يرجع Array عند استخدام RETURNS TABLE
  const rawRow: any = Array.isArray(data) ? data[0] : data;

  if (!rawRow || !rawRow.order_number) {
    console.error("❌ Invalid RPC response:", data);
    return {
      success: false,
      error: "تعذر قراءة بيانات الطلب من الخادم. يرجى المحاولة مرة أخرى.",
    };
  }

  const orderNumber = String(rawRow.order_number);
  const trackingToken = String(rawRow.tracking_token ?? "");
  const totalAmount = Number(rawRow.total_amount || 0);

  console.log("📦 Order created:", { orderNumber, trackingToken, totalAmount });

  // ✅ جلب تفاصيل الطلب كاملة من الداتابيز عشان نبعتها للواتساب
  const { data: fullOrder } = await serviceClient
    .from("orders")
    .select(`
      *,
      order_items (
        product_title_snapshot, size_snapshot, color_snapshot, quantity, unit_price
      )
    `)
    .eq("order_number", orderNumber)
    .single();

  if (fullOrder) {
    await sendWhatsAppOrderNotification({
      orderNumber: fullOrder.order_number,
      trackingToken: fullOrder.tracking_token,
      customerName: fullOrder.customer_name,
      customerPhone: fullOrder.customer_phone,
      governorate: fullOrder.governorate,
      city: fullOrder.city,
      streetAddress: fullOrder.street_address,
      landmark: fullOrder.landmark,
      subtotal: Number(fullOrder.subtotal_amount),
      shippingFee: Number(fullOrder.shipping_fee),
      discountAmount: Number(fullOrder.discount_amount),
      totalAmount: Number(fullOrder.total_amount),
      items: (fullOrder.order_items || []).map((item: any) => ({
        title: item.product_title_snapshot,
        size: item.size_snapshot,
        color: item.color_snapshot,
        quantity: item.quantity,
        price: item.unit_price
      }))
    });
  }

  return {
    success: true,
    orderNumber,
    trackingToken,
    totalAmount,
  };
}

export interface OrderTrackingDetails {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  customerName: string;
  governorate: string;
  city: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    sizeName: string;
    colorName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  history: Array<{
    id: string;
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
  }>;
}

export async function getSecureOrderTrackingAction(params: {
  orderNumber: string;
  verificationValue: string;
}): Promise<{
  success: boolean;
  error?: string;
  order?: OrderTrackingDetails;
}> {
  const parsed = trackOrderSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "بيانات التحقق غير صالحة",
    };
  }

  const cleanOrderNumber = parsed.data.orderNumber.toUpperCase().trim();
  const cleanVerify = parsed.data.verificationValue.trim();

  const serviceClient = createServiceRoleClient();

  const { data: order, error: orderError } = await serviceClient
    .from("orders")
    .select(`
      id, order_number, tracking_token, status, customer_name, customer_phone,
      governorate, city, subtotal_amount, shipping_fee, total_amount, created_at,
      order_items (
        id, product_title_snapshot, sku_snapshot, size_snapshot, color_snapshot,
        quantity, unit_price, line_total
      )
    `)
    .eq("order_number", cleanOrderNumber)
    .single();

  if (orderError || !order) {
    console.error("Tracking error:", orderError?.message);
    return {
      success: false,
      error:
        "لم يتم العثور على طلب مطابق لبيانات التحقق المدخلة. تأكد من رقم الطلب ورقم الهاتف المسجل به.",
    };
  }

  const phoneMatch = String(order.customer_phone).trim() === cleanVerify;
  const tokenMatch = String(order.tracking_token).trim() === cleanVerify;

  if (!phoneMatch && !tokenMatch) {
    return {
      success: false,
      error:
        "لم يتم العثور على طلب مطابق لبيانات التحقق المدخلة. تأكد من رقم الطلب ورقم الهاتف المسجل به.",
    };
  }

  const rawItems = Array.isArray(order.order_items)
    ? (order.order_items as Array<Record<string, unknown>>)
    : [];

  return {
    success: true,
    order: {
      orderId: String(order.id),
      orderNumber: String(order.order_number),
      status: (order.status as OrderStatus) || "pending",
      paymentMethod: "cod",
      paymentStatus: "uncollected", // ✅ تم إصلاح هذه القيمة
      customerName: String(order.customer_name || ""),
      governorate: String(order.governorate || ""),
      city: String(order.city || ""),
      subtotalAmount: Number(order.subtotal_amount || 0),
      discountAmount: 0,
      shippingFee: Number(order.shipping_fee || 0),
      totalAmount: Number(order.total_amount || 0),
      createdAt: String(order.created_at),
      items: rawItems.map((item) => ({
        id: String(item.id),
        productName: String(item.product_title_snapshot || "منتج"),
        sku: String(item.sku_snapshot || "-"),
        sizeName: String(item.size_snapshot || "-"),
        colorName: String(item.color_snapshot || "-"),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unit_price || 0),
        lineTotal: Number(item.line_total || 0),
      })),
      history: [
        {
          id: "initial",
          toStatus: (order.status as OrderStatus) || "pending",
          note: "تم إنشاء الطلب",
          createdAt: String(order.created_at),
        },
      ],
    },
  };
}

export async function getDefaultAddressAction() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  const { data: address } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  return {
    fullName: profile?.full_name || "",
    phone: profile?.phone || "",
    address: address || null,
  };
}