"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { AdminRole } from "@/types/domain.types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseOptionalUuid(
  val: FormDataEntryValue | string | null | undefined
): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return null;
  }
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

function parseSafeNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const normalized = String(val)
    .trim()
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (!normalized) return fallback;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : fallback;
}

function parseSafeInt(val: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(parseSafeNumber(val, fallback)));
}

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف"),
});

export interface LoginActionResult {
  success: boolean;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireActiveAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("غير مصرح لك بتنفيذ هذا الإجراء. يرجى تسجيل الدخول.");
  }

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    throw new Error("حساب المشرف غير نشط أو غير مصرح له.");
  }

  return { user, profile, service };
}

async function requireRole(allowedRoles: string[]) {
  const { user, profile, service } = await requireActiveAdmin();

  if (!allowedRoles.includes(profile.role as string)) {
    throw new Error("صلاحيات غير كافية لتنفيذ هذا الإجراء");
  }

  return { user, profile, service };
}

const requireFullAdmin = () => requireRole(["admin", "owner"]);
const requireOrderManager = () =>
  requireRole(["admin", "owner", "order_manager"]);
const requireInventoryManager = () =>
  requireRole(["admin", "owner", "inventory_manager"]);

async function ensureSizeRecord(
  service: ReturnType<typeof createServiceRoleClient>,
  sizeText: string
): Promise<string | null> {
  const cleanCode = sizeText.trim().toUpperCase() || "L";
  const { data: existing } = await service
    .from("sizes")
    .select("id")
    .ilike("code", cleanCode)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created } = await service
    .from("sizes")
    .insert({
      code: cleanCode,
      name_ar: cleanCode,
      display_order: 10,
      is_active: true,
    })
    .select("id")
    .maybeSingle();

  return created?.id ?? null;
}

async function ensureColorRecord(
  service: ReturnType<typeof createServiceRoleClient>,
  colorText: string
): Promise<string | null> {
  const cleanName = colorText.trim() || "أسود";
  const { data: existing } = await service
    .from("colors")
    .select("id")
    .or(`name_ar.eq.${cleanName},code.ilike.${cleanName}`)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const generatedCode =
    cleanName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]+/g, "") || `clr-${Date.now()}`;

  const { data: created } = await service
    .from("colors")
    .insert({
      code: generatedCode,
      name_ar: cleanName,
      hex_code: "#111827",
      is_active: true,
    })
    .select("id")
    .maybeSingle();

  return created?.id ?? null;
}

// 1. تسجيل دخول المشرف
export async function signInAdminAction(formData: {
  email: string;
  password: string;
}): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "بيانات الدخول غير صالحة",
    };
  }

  const supabase = createServerSupabaseClient();

  const { data: authData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

  if (signInError || !authData.user) {
    return {
      success: false,
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة أو أنه موقوف.",
    };
  }

  const serviceClient = createServiceRoleClient();
  await serviceClient.from("audit_logs").insert({
    actor_id: profile.id as string,
    actor_role: profile.role as AdminRole,
    action: "admin_login_success",
    entity_type: "profile",
    entity_id: profile.id as string,
    new_values: { email: authData.user.email },
  });

  return { success: true };
}

// 2. تسجيل خروج المشرف
export async function signOutAdminAction(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// 3. إضافة قسم جديد
export async function createCategoryAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { service } = await requireInventoryManager();
    const name = String(formData.get("name") ?? "").trim();
    const rawSlug = String(formData.get("slug") ?? "").trim();

    if (!name) return { success: false, error: "اسم القسم مطلوب" };

    const slug =
      rawSlug
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u0600-\u06FF-]+/g, "") || `cat-${Date.now()}`;

    const { data: existingSlug } = await service
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return {
        success: false,
        error: `الرابط المختصر للقسم (${slug}) مستخدم بالفعل لقسم آخر.`,
      };
    }

    const { error } = await service.from("categories").insert({
      name,
      slug,
      is_active: true,
      is_published: true,
      display_order: 0,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر إنشاء القسم" };
  }
}

// 4. إضافة منتج جديد
export async function createProductAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { service } = await requireInventoryManager();

    const title = String(
      formData.get("title") || formData.get("name") || ""
    ).trim();
    if (!title) {
      return { success: false, error: "اسم المنتج مطلوب." };
    }

    const rawSlug = String(formData.get("slug") ?? "").trim();
    const slug =
      rawSlug
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u0600-\u06FF-]+/g, "") || `prod-${Date.now()}`;

    const { data: existingProduct } = await service
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingProduct) {
      return {
        success: false,
        error: `الرابط المختصر (${slug}) مستخدم بالفعل لمنتج آخر. يرجى تغييره.`,
      };
    }

    const sellingPrice = parseSafeNumber(
      formData.get("price") ?? formData.get("base_price"),
      -1
    );
    if (sellingPrice <= 0) {
      return {
        success: false,
        error: "يرجى إدخال سعر بيع صحيح أكبر من صفر.",
      };
    }

    const costPrice = parseSafeNumber(formData.get("cost_price"), 0);
    if (costPrice < 0) {
      return {
        success: false,
        error: "تكلفة المنتج لا يمكن أن تكون رقماً سالباً.",
      };
    }

    const categoryId = parseOptionalUuid(formData.get("category_id"));
    const description =
      String(formData.get("description") ?? "").trim() || null;

    const size = String(formData.get("size") ?? "L").trim().toUpperCase() || "L";
    const color = String(formData.get("color") ?? "أسود").trim() || "أسود";
    const sku =
      String(formData.get("sku") ?? "").trim() ||
      `SKU-${Math.floor(10000 + Math.random() * 90000)}`;

    const { data: existingSku } = await service
      .from("product_variants")
      .select("id")
      .eq("sku", sku)
      .maybeSingle();

    if (existingSku) {
      return {
        success: false,
        error: `كود المخزن SKU (${sku}) مستخدم بالفعل. يرجى كتابة كود مختلف.`,
      };
    }

    const initialStock = parseSafeInt(
      formData.get("initial_stock") ??
        formData.get("stock_quantity") ??
        formData.get("stock"),
      0
    );

    let finalImageUrl =
      String(formData.get("image_url") ?? "").trim() || null;
    const imageFile = formData.get("image_file") as File | null;

    if (imageFile && typeof imageFile === "object" && imageFile.size > 0) {
      if (!imageFile.type.startsWith("image/")) {
        return {
          success: false,
          error: "الملف المرفوع يجب أن يكون صورة صالحة.",
        };
      }

      const ext = (imageFile.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const fileName = `prod_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}.${ext || "jpg"}`;

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await service.storage
        .from("product-images")
        .upload(fileName, buffer, {
          contentType: imageFile.type || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        return {
          success: false,
          error: `فشل رفع صورة المنتج إلى التخزين السحابي: ${uploadError.message}`,
        };
      }

      const { data: publicUrlData } = service.storage
        .from("product-images")
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        return {
          success: false,
          error: "تعذر استخراج الرابط العام للصورة بعد رفعها.",
        };
      }

      finalImageUrl = publicUrlData.publicUrl;
    }

    const productCode = `PRD-${sku}`;

    const { data: product, error: prodErr } = await service
      .from("products")
      .insert({
        title,
        name: title,
        slug,
        product_code: productCode,
        description,
        short_description: description,
        long_description: description,
        category_id: categoryId,
        base_price: sellingPrice,
        price: sellingPrice,
        cost_price: costPrice,
        image_url: finalImageUrl,
        is_active: true,
        is_published: true,
      })
      .select("id")
      .single();

    if (prodErr || !product) {
      return {
        success: false,
        error: prodErr?.message || "فشل في إنشاء سجل المنتج الأساسي.",
      };
    }

    if (finalImageUrl) {
      const { error: imgErr } = await service.from("product_images").insert({
        product_id: product.id,
        image_url: finalImageUrl,
        alt_text: title,
        is_primary: true,
        display_order: 0,
      });

      if (imgErr) {
        console.error("Warning: Failed inserting product_images:", imgErr.message);
      }
    }

    const [sizeId, colorId] = await Promise.all([
      ensureSizeRecord(service, size),
      ensureColorRecord(service, color),
    ]);

    const { data: variant, error: varErr } = await service
      .from("product_variants")
      .insert({
        product_id: product.id,
        sku,
        size,
        color,
        size_id: sizeId,
        color_id: colorId,
        stock: initialStock,
        stock_quantity: initialStock,
        reserved_quantity: 0,
        selling_price: sellingPrice,
        is_active: true,
      })
      .select("id")
      .single();

    if (varErr || !variant) {
      return {
        success: false,
        error: `تم إنشاء المنتج لكن تعذر إنشاء المقاس الافتتاحي: ${varErr?.message ?? ""}`,
      };
    }

    const { error: invErr } = await service.from("inventory_balances").insert({
      variant_id: variant.id,
      physical_qty: initialStock,
      reserved_qty: 0,
      available_qty: initialStock,
    });

    if (invErr) {
      console.error("Inventory balance insert error:", invErr.message);
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    revalidatePath(`/products/${slug}`);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "حدث خطأ غير متوقع أثناء إضافة المنتج.",
    };
  }
}

export async function createProductWithVariantAction(
  formData: FormData
): Promise<ActionResult> {
  return createProductAction(formData);
}

// 5. إضافة مقاس ولون إضافي
export async function addVariantToProductAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { service } = await requireInventoryManager();
    const productId = parseOptionalUuid(formData.get("product_id"));
    if (!productId) {
      return { success: false, error: "معرّف المنتج غير صالح." };
    }

    const size = String(formData.get("size") ?? "L").trim().toUpperCase() || "L";
    const color = String(formData.get("color") ?? "أسود").trim() || "أسود";
    const sku =
      String(formData.get("sku") ?? "").trim() ||
      `SKU-${Math.floor(10000 + Math.random() * 90000)}`;

    const stock = parseSafeInt(
      formData.get("stock_quantity") ?? formData.get("stock"),
      0
    );

    const { data: prod } = await service
      .from("products")
      .select("base_price, price, slug")
      .eq("id", productId)
      .single();

    const fallbackPrice = parseSafeNumber(prod?.base_price ?? prod?.price, 0);
    const sellingPrice = parseSafeNumber(formData.get("price"), fallbackPrice);

    const { data: existingSku } = await service
      .from("product_variants")
      .select("id")
      .eq("sku", sku)
      .maybeSingle();

    if (existingSku) {
      return {
        success: false,
        error: `كود المخزن SKU (${sku}) مستخدم بالفعل. يرجى إدخال كود آخر.`,
      };
    }

    const [sizeId, colorId] = await Promise.all([
      ensureSizeRecord(service, size),
      ensureColorRecord(service, color),
    ]);

    const { data: variant, error } = await service
      .from("product_variants")
      .insert({
        product_id: productId,
        sku,
        size,
        color,
        size_id: sizeId,
        color_id: colorId,
        stock,
        stock_quantity: stock,
        reserved_quantity: 0,
        selling_price: sellingPrice > 0 ? sellingPrice : fallbackPrice,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !variant) {
      return {
        success: false,
        error: error?.message || "تعذر إضافة المقاس الجديد.",
      };
    }

    await service.from("inventory_balances").insert({
      variant_id: variant.id,
      physical_qty: stock,
      reserved_qty: 0,
      available_qty: stock,
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    if (prod?.slug) revalidatePath(`/products/${prod.slug}`);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر إضافة المقاس." };
  }
}

// 6. تحديث كمية المخزون
export async function updateVariantStockAction(
  input:
    | FormData
    | { variantId: string; newStock: number; reason?: string }
): Promise<ActionResult> {
  try {
    const { service } = await requireInventoryManager();
    let variantId: string | null = null;
    let newStock = 0;

    if (input instanceof FormData) {
      variantId = parseOptionalUuid(
        input.get("variant_id") ?? input.get("variantId")
      );
      newStock = parseSafeInt(
        input.get("newStock") ??
          input.get("stock_quantity") ??
          input.get("quantity"),
        0
      );
    } else {
      variantId = parseOptionalUuid(input.variantId);
      newStock = parseSafeInt(input.newStock, 0);
    }

    if (!variantId) {
      return { success: false, error: "معرّف المقاس غير صالح." };
    }

    const { data: existingBal } = await service
      .from("inventory_balances")
      .select("id, reserved_qty")
      .eq("variant_id", variantId)
      .maybeSingle();

    const reservedQty = parseSafeInt(existingBal?.reserved_qty, 0);
    const availableQty = Math.max(0, newStock - reservedQty);

    const { error: varUpdateErr } = await service
      .from("product_variants")
      .update({
        stock: newStock,
        stock_quantity: newStock,
      })
      .eq("id", variantId);

    if (varUpdateErr) {
      return { success: false, error: varUpdateErr.message };
    }

    if (existingBal?.id) {
      const { error: balErr } = await service
        .from("inventory_balances")
        .update({
          physical_qty: newStock,
          available_qty: availableQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBal.id);

      if (balErr) return { success: false, error: balErr.message };
    } else {
      const { error: balInsertErr } = await service
        .from("inventory_balances")
        .insert({
          variant_id: variantId,
          physical_qty: newStock,
          reserved_qty: 0,
          available_qty: newStock,
        });

      if (balInsertErr) return { success: false, error: balInsertErr.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر تحديث المخزون." };
  }
}

// 7. تحديث حالة الطلب — Wrapper للدالة المتقدمة (تضمن إدارة المخزون)
export async function updateOrderStatusAction(
  input:
    | FormData
    | { orderId: string; newStatus: string; note?: string }
): Promise<ActionResult> {
  let orderId: string | null = null;
  let status = "";

  if (input instanceof FormData) {
    orderId = parseOptionalUuid(
      input.get("order_id") ?? input.get("orderId") ?? input.get("id")
    );
    status = String(input.get("status") ?? input.get("newStatus") ?? "").trim();
  } else {
    orderId = parseOptionalUuid(input.orderId);
    status = String(input.newStatus ?? "").trim();
  }

  if (!orderId || !status) {
    return { success: false, error: "بيانات الطلب غير مكتملة." };
  }

  // ✅ نمرر للدالة المتقدمة لضمان إدارة المخزون
  return updateOrderStatusAdvancedAction(orderId, status);
}

// 8. تحديث الشحن
export async function updateShippingRateAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { service } = await requireFullAdmin();
    const id = String(formData.get("id") ?? "").trim();
    const shippingFee = parseSafeNumber(formData.get("shipping_fee"), 0);
    const estimatedDays = String(formData.get("estimated_days") ?? "").trim();

    if (!id) return { success: false, error: "معرف المنطقة مطلوب" };

    const updateData: any = {
      customer_shipping_fee: shippingFee,
    };

    if (estimatedDays) {
      updateData.estimated_delivery_days = estimatedDays;
    }

    const { error } = await service
      .from("shipping_zones")
      .update(updateData)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر تحديث سعر الشحن." };
  }
}

// 9. إنشاء كوبون
export async function createCouponAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { service } = await requireFullAdmin();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const discountType = String(formData.get("discount_type") ?? "percentage");
    const discountValue = parseSafeNumber(formData.get("discount_value"), 0);
    const minOrderAmount = parseSafeNumber(formData.get("min_order_amount"), 0);

    if (!code) return { success: false, error: "كود الكوبون مطلوب" };
    if (discountValue <= 0) {
      return { success: false, error: "قيمة الخصم يجب أن تكون أكبر من صفر." };
    }

    const { error } = await service.from("coupons").insert({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_amount: minOrderAmount,
      min_order_subtotal: minOrderAmount,
      is_active: true,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/settings");
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر إنشاء الكوبون." };
  }
}

// 10. حذف أو أرشفة المنتج
export async function deleteOrArchiveProductAction(
  productId: string
): Promise<ActionResult> {
  try {
    const { service } = await requireInventoryManager();
    const cleanId = parseOptionalUuid(productId);

    if (!cleanId) {
      return { success: false, error: "معرّف المنتج غير صالح." };
    }

    const { data: variants } = await service
      .from("product_variants")
      .select("id")
      .eq("product_id", cleanId);

    const variantIds = (variants || []).map((v) => v.id);

    let hasOrders = false;
    if (variantIds.length > 0) {
      const { count } = await service
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .in("variant_id", variantIds);

      hasOrders = (count ?? 0) > 0;
    }

    if (hasOrders) {
      const { error: updateErr } = await service
        .from("products")
        .update({
          deleted_at: new Date().toISOString(),
          is_published: false,
          is_active: false,
        })
        .eq("id", cleanId);

      if (updateErr) return { success: false, error: updateErr.message };

      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath("/");
      return { success: true };
    }

    await service.from("product_variants").delete().eq("product_id", cleanId);
    await service.from("product_images").delete().eq("product_id", cleanId);

    const { error: deleteErr } = await service
      .from("products")
      .delete()
      .eq("id", cleanId);

    if (deleteErr) return { success: false, error: deleteErr.message };

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر حذف المنتج." };
  }
}

// 11. تبديل حالة النشر
export async function toggleProductPublishAction(
  productId: string,
  isPublished: boolean
): Promise<ActionResult> {
  try {
    const { service } = await requireInventoryManager();
    const cleanId = parseOptionalUuid(productId);
    if (!cleanId) return { success: false, error: "معرّف المنتج غير صالح." };

    const { error } = await service
      .from("products")
      .update({
        is_published: isPublished,
        is_active: isPublished,
      })
      .eq("id", cleanId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر تحديث حالة النشر." };
  }
}

// 12. حذف قسم
export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult> {
  try {
    const { service } = await requireInventoryManager();
    const cleanId = parseOptionalUuid(categoryId);
    if (!cleanId) return { success: false, error: "معرّف القسم غير صالح." };

    const { count } = await service
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", cleanId)
      .is("deleted_at", null);

    if ((count ?? 0) > 0) {
      return {
        success: false,
        error: `لا يمكن حذف هذا القسم لأنه يحتوي على (${count}) منتج نشط. يجدر بك نقل المنتجات لقسم آخر أولاً.`,
      };
    }

    const { error } = await service
      .from("categories")
      .update({ deleted_at: new Date().toISOString(), is_published: false })
      .eq("id", cleanId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر حذف القسم." };
  }
}

// 13. جلب تفاصيل الطلبات
export async function getAdminOrdersOverview() {
  const { service } = await requireActiveAdmin();

  const { data: orders, error } = await service
    .from("orders")
    .select(`
      *,
      order_items (
        id, product_id, variant_id, quantity, unit_price, total_price,
        product_variants ( size, color, sku )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin orders:", error.message);
    return [];
  }

  return orders || [];
}

// 14. تحديث حالة الطلب المتقدم — إدارة كاملة للمخزون (إرجاع + إعادة خصم)
const CANCELLED_STATUSES = ["cancelled", "returned"];

export async function updateOrderStatusAdvancedAction(
  orderId: string,
  newStatus: string
): Promise<ActionResult> {
  try {
    const { service } = await requireOrderManager();
    const cleanOrderId = parseOptionalUuid(orderId);
    if (!cleanOrderId) {
      return { success: false, error: "معرّف الطلب غير صالح." };
    }

    const { data: order, error: fetchErr } = await service
      .from("orders")
      .select("id, status, order_items ( variant_id, quantity )")
      .eq("id", cleanOrderId)
      .single();

    if (fetchErr || !order) {
      return { success: false, error: "الطلب غير موجود." };
    }

    const oldStatus = order.status;
    const oldWasCancelled = CANCELLED_STATUSES.includes(oldStatus as string);
    const newWillBeCancelled = CANCELLED_STATUSES.includes(newStatus);
    const items = Array.isArray(order.order_items) ? order.order_items : [];

    // ============================================
    // 1) كان نشط → أصبح ملغي/مرتجع = إرجاع المخزون
    // ============================================
    if (!oldWasCancelled && newWillBeCancelled) {
      for (const item of items) {
        if (!item.variant_id || !item.quantity) continue;
        const qty = Number(item.quantity);

        const { data: bal } = await service
          .from("inventory_balances")
          .select("id, physical_qty, available_qty")
          .eq("variant_id", item.variant_id)
          .maybeSingle();

        if (bal) {
          await service
            .from("inventory_balances")
            .update({
              available_qty: Number(bal.available_qty || 0) + qty,
              physical_qty: Number(bal.physical_qty || 0) + qty,
              updated_at: new Date().toISOString(),
            })
            .eq("id", bal.id);
        }

        const { data: variant } = await service
          .from("product_variants")
          .select("stock, stock_quantity")
          .eq("id", item.variant_id)
          .maybeSingle();

        if (variant) {
          await service
            .from("product_variants")
            .update({
              stock: Number(variant.stock || 0) + qty,
              stock_quantity: Number(variant.stock_quantity || 0) + qty,
            })
            .eq("id", item.variant_id);
        }

        console.log(
          `♻️ RESTOCKED ${qty} for variant ${item.variant_id} (order ${order.id})`
        );
      }
    }

    // ============================================
    // 2) كان ملغي/مرتجع → أصبح نشط = إعادة خصم المخزون
    // ============================================
    if (oldWasCancelled && !newWillBeCancelled) {
      for (const item of items) {
        if (!item.variant_id || !item.quantity) continue;
        const qty = Number(item.quantity);

        const { data: bal } = await service
          .from("inventory_balances")
          .select("id, physical_qty, available_qty")
          .eq("variant_id", item.variant_id)
          .maybeSingle();

        if (bal) {
          await service
            .from("inventory_balances")
            .update({
              available_qty: Math.max(0, Number(bal.available_qty || 0) - qty),
              physical_qty: Math.max(0, Number(bal.physical_qty || 0) - qty),
              updated_at: new Date().toISOString(),
            })
            .eq("id", bal.id);
        }

        const { data: variant } = await service
          .from("product_variants")
          .select("stock, stock_quantity")
          .eq("id", item.variant_id)
          .maybeSingle();

        if (variant) {
          await service
            .from("product_variants")
            .update({
              stock: Math.max(0, Number(variant.stock || 0) - qty),
              stock_quantity: Math.max(
                0,
                Number(variant.stock_quantity || 0) - qty
              ),
            })
            .eq("id", item.variant_id);
        }

        console.log(
          `📦 RE-DEDUCTED ${qty} for variant ${item.variant_id} (order ${order.id})`
        );
      }
    }

    // ============================================
    // 3) تحديث حالة الطلب
    // ============================================
    const { error: updateErr } = await service
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", cleanOrderId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${cleanOrderId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "تعذر تحديث حالة الطلب.",
    };
  }
}

// 15. تبديل حالة تفعيل الشحن
export async function toggleShippingZoneActiveAction(
  zoneId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { service } = await requireFullAdmin();
    const cleanId = parseOptionalUuid(zoneId);
    if (!cleanId) return { success: false, error: "معرف المنطقة غير صالح." };

    const { error } = await service
      .from("shipping_zones")
      .update({ is_active: isActive })
      .eq("id", cleanId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "تعذر تحديث حالة الشحن." };
  }
}