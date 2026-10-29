import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/types/domain.types";

export interface CatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  product_code: string;
  base_price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  total_sold_count: number;
  category: { id: string; name: string; slug: string } | null;
  primary_image_url: string | null;
  total_available_qty: number;
}

export interface ProductFilterParams {
  q?: string;
  categorySlug?: string;
  sizeCode?: string;
  colorCode?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "best_selling";
  page?: number;
  pageSize?: number;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    value.trim().toLowerCase() !== "null" &&
    value.trim().toLowerCase() !== "undefined" &&
    UUID_REGEX.test(value.trim())
  );
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "متجر الملابس الرسمي",
  store_tagline: "أزياء عصرية بجودة مصرية فاخرة",
  logo_url: null,
  primary_color_rgb: "17 24 39",
  secondary_color_rgb: "75 85 99",
  accent_color_rgb: "180 83 9",
  support_phone: "01000000000",
  support_whatsapp: "201000000000",
  support_email: "support@example.com",
  address_text: "القاهرة، جمهورية مصر العربية",
  free_shipping_threshold: null,
  return_window_days: 14,
};

export async function getStoreSettings(): Promise<
  StoreSettings & {
    hero_banners: Array<{
      title: string;
      subtitle?: string;
      image_url?: string;
      cta_text?: string;
      cta_link?: string;
    }>;
    size_guide_default: Array<{
      size: string;
      chest_cm: string;
      length_cm: string;
      shoulder_cm?: string;
    }>;
    policies: Record<string, unknown>;
  }
> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!data) {
    return {
      ...DEFAULT_STORE_SETTINGS,
      hero_banners: [],
      size_guide_default: [],
      policies: {},
    };
  }

  return {
    id: 1,
    store_name: (data.store_name as string) || DEFAULT_STORE_SETTINGS.store_name,
    store_tagline:
      (data.store_tagline as string) || DEFAULT_STORE_SETTINGS.store_tagline,
    logo_url: (data.logo_url as string | null) ?? null,
    primary_color_rgb:
      (data.primary_color_rgb as string) ||
      DEFAULT_STORE_SETTINGS.primary_color_rgb,
    secondary_color_rgb:
      (data.secondary_color_rgb as string) ||
      DEFAULT_STORE_SETTINGS.secondary_color_rgb,
    accent_color_rgb:
      (data.accent_color_rgb as string) ||
      DEFAULT_STORE_SETTINGS.accent_color_rgb,
    support_phone:
      (data.support_phone as string) || DEFAULT_STORE_SETTINGS.support_phone,
    support_whatsapp:
      (data.support_whatsapp as string) ||
      DEFAULT_STORE_SETTINGS.support_whatsapp,
    support_email:
      (data.support_email as string) || DEFAULT_STORE_SETTINGS.support_email,
    address_text:
      (data.address_text as string) || DEFAULT_STORE_SETTINGS.address_text,
    free_shipping_threshold:
      data.free_shipping_threshold !== null
        ? Number(data.free_shipping_threshold)
        : null,
    return_window_days: Number(data.return_window_days ?? 14),
    hero_banners: Array.isArray(data.hero_banners) ? data.hero_banners : [],
    size_guide_default: Array.isArray(data.size_guide_default)
      ? data.size_guide_default
      : [],
    policies:
      typeof data.policies === "object" && data.policies !== null
        ? (data.policies as Record<string, unknown>)
        : {},
  };
}

export async function getPublishedCategories() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url, display_order, is_published, is_active")
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error.message);
    return [];
  }

  return (data ?? []).filter(
    (c) => c.is_published !== false && c.is_active !== false
  );
}

export async function getActiveAttributes() {
  const supabase = createServerSupabaseClient();
  const [sizesRes, colorsRes] = await Promise.all([
    supabase
      .from("sizes")
      .select("id, code, name_ar, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("colors")
      .select("id, code, name_ar, hex_code")
      .eq("is_active", true)
      .order("name_ar", { ascending: true }),
  ]);

  return {
    sizes: sizesRes.data ?? [],
    colors: colorsRes.data ?? [],
  };
}

function isProductVisibleInStore(row: Record<string, unknown>): boolean {
  if (row.deleted_at !== null && row.deleted_at !== undefined) return false;
  if (row.is_active === false) return false;
  if (row.is_published === false && row.is_active !== true) return false;
  return true;
}

function extractVariantAvailableQty(v: Record<string, unknown>): number {
  const bal = Array.isArray(v.inventory_balances)
    ? v.inventory_balances[0]
    : v.inventory_balances;

  if (bal && typeof bal === "object" && "available_qty" in bal) {
    const qty = Number((bal as Record<string, unknown>).available_qty);
    if (!Number.isNaN(qty)) return Math.max(0, qty);
  }

  const fallbackStock = Number(v.stock_quantity ?? v.stock ?? 0);
  const reserved = Number(v.reserved_quantity ?? 0);
  if (!Number.isNaN(fallbackStock)) {
    return Math.max(0, fallbackStock - (Number.isNaN(reserved) ? 0 : reserved));
  }

  return 0;
}

function mapRawProductsToSummaries(
  rawProducts: unknown[]
): CatalogProductSummary[] {
  return (rawProducts as Array<Record<string, unknown>>)
    .filter(isProductVisibleInStore)
    .map((row) => {
      const images = Array.isArray(row.product_images)
        ? (row.product_images as Array<{
            image_url: string;
            is_primary: boolean | null;
            display_order: number | null;
          }>)
        : [];

      const sortedImages = [...images].sort((a, b) => {
        if (Boolean(a.is_primary) !== Boolean(b.is_primary)) {
          return a.is_primary ? -1 : 1;
        }
        return Number(a.display_order ?? 0) - Number(b.display_order ?? 0);
      });

      const directImageUrl =
        typeof row.image_url === "string" && row.image_url.trim() !== ""
          ? row.image_url.trim()
          : null;

      const primaryImageUrl =
        sortedImages[0]?.image_url || directImageUrl || null;

      const variants = Array.isArray(row.product_variants)
        ? (row.product_variants as Array<Record<string, unknown>>)
        : [];

      const totalAvailable = variants.reduce((sum, v) => {
        if (v.is_active === false || v.deleted_at !== null) return sum;
        return sum + extractVariantAvailableQty(v);
      }, 0);

      const catObj = Array.isArray(row.categories)
        ? row.categories[0]
        : row.categories;

      const displayName = String(row.name || row.title || "منتج");
      const basePrice = Number(row.base_price ?? row.price ?? 0);
      const compareAt =
        row.compare_at_price !== null && row.compare_at_price !== undefined
          ? Number(row.compare_at_price)
          : null;

      return {
        id: String(row.id),
        name: displayName,
        slug: String(row.slug),
        product_code: String(
          row.product_code || `PRD-${String(row.id).slice(0, 6)}`
        ),
        base_price: Number.isNaN(basePrice) ? 0 : basePrice,
        compare_at_price:
          compareAt !== null && !Number.isNaN(compareAt) ? compareAt : null,
        is_featured: Boolean(row.is_featured),
        total_sold_count: Number(row.total_sold_count ?? 0),
        category:
          catObj && typeof catObj === "object"
            ? {
                id: String((catObj as Record<string, unknown>).id),
                name: String((catObj as Record<string, unknown>).name),
                slug: String((catObj as Record<string, unknown>).slug),
              }
            : null,
        primary_image_url: primaryImageUrl,
        total_available_qty: totalAvailable,
      };
    });
}

const PRODUCT_SUMMARY_SELECT = `
  id, name, title, slug, product_code, base_price, price, compare_at_price,
  image_url, is_featured, is_published, is_active, deleted_at, total_sold_count, created_at,
  categories ( id, name, slug ),
  product_images ( id, image_url, is_primary, display_order ),
  product_variants (
    id, sku, size, color, stock, stock_quantity, reserved_quantity,
    selling_price, compare_at_price, is_active, deleted_at,
    sizes ( id, code, name_ar, display_order ),
    colors ( id, code, name_ar, hex_code ),
    inventory_balances ( physical_qty, reserved_qty, available_qty )
  )
`;

export async function getHomePageSections() {
  const supabase = createServerSupabaseClient();

  const [latestRes, featuredRes, bestSellingRes, offersRes] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_SUMMARY_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("products")
      .select(PRODUCT_SUMMARY_SELECT)
      .eq("is_featured", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select(PRODUCT_SUMMARY_SELECT)
      .is("deleted_at", null)
      .gt("total_sold_count", 0)
      .order("total_sold_count", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select(PRODUCT_SUMMARY_SELECT)
      .is("deleted_at", null)
      .not("compare_at_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (latestRes.error) {
    console.error("Error loading home products:", latestRes.error.message);
  }

  return {
    latestProducts: mapRawProductsToSummaries(latestRes.data ?? []).slice(0, 8),
    featuredProducts: mapRawProductsToSummaries(featuredRes.data ?? []).slice(0, 4),
    bestSellingProducts: mapRawProductsToSummaries(bestSellingRes.data ?? []).slice(0, 4),
    discountedProducts: mapRawProductsToSummaries(offersRes.data ?? [])
      .filter(
        (p) => p.compare_at_price !== null && p.compare_at_price > p.base_price
      )
      .slice(0, 4),
  };
}

export async function getFilteredCatalogProducts(params: ProductFilterParams) {
  const supabase = createServerSupabaseClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 12;

  let query = supabase
    .from("products")
    .select(PRODUCT_SUMMARY_SELECT)
    .is("deleted_at", null);

  if (params.q && params.q.trim() !== "") {
    const cleanQ = params.q.trim();
    query = query.or(
      `name.ilike.%${cleanQ}%,title.ilike.%${cleanQ}%,product_code.ilike.%${cleanQ}%`
    );
  }

  if (typeof params.minPrice === "number" && !Number.isNaN(params.minPrice)) {
    query = query.gte("base_price", params.minPrice);
  }

  if (typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)) {
    query = query.lte("base_price", params.maxPrice);
  }

  switch (params.sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "best_selling":
      query = query.order("total_sold_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error in getFilteredCatalogProducts:", error.message);
  }

  const rawList = ((data ?? []) as Array<Record<string, unknown>>).filter(
    isProductVisibleInStore
  );

  const filteredRaw = rawList.filter((product) => {
    if (params.categorySlug && params.categorySlug.trim() !== "") {
      const catObj = Array.isArray(product.categories)
        ? product.categories[0]
        : product.categories;
      const catSlug = (catObj as Record<string, unknown> | null)?.slug;
      if (catSlug !== params.categorySlug.trim()) return false;
    }

    const variants = Array.isArray(product.product_variants)
      ? (product.product_variants as Array<Record<string, unknown>>)
      : [];

    const activeVariants = variants.filter(
      (v) => v.is_active !== false && v.deleted_at === null
    );

    if (params.sizeCode || params.colorCode || params.inStockOnly) {
      return activeVariants.some((v) => {
        const sizeObj = Array.isArray(v.sizes) ? v.sizes[0] : v.sizes;
        const colorObj = Array.isArray(v.colors) ? v.colors[0] : v.colors;

        const vSizeCode = String(
          (sizeObj as Record<string, unknown> | null)?.code ?? v.size ?? ""
        );
        const vColorCode = String(
          (colorObj as Record<string, unknown> | null)?.code ?? v.color ?? ""
        );
        const vAvailable = extractVariantAvailableQty(v);

        const matchSize = !params.sizeCode || vSizeCode === params.sizeCode;
        const matchColor = !params.colorCode || vColorCode === params.colorCode;
        const matchStock = !params.inStockOnly || vAvailable > 0;

        return matchSize && matchColor && matchStock;
      });
    }

    return true;
  });

  const totalCount = filteredRaw.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedRaw = filteredRaw.slice(startIndex, startIndex + pageSize);

  return {
    products: mapRawProductsToSummaries(paginatedRaw),
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getPublishedProductBySlug(slug: string) {
  const supabase = createServerSupabaseClient();
  const cleanSlug = decodeURIComponent(String(slug ?? "").trim());
  if (!cleanSlug) return null;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id, name, title, slug, product_code, description, short_description, long_description,
      base_price, price, compare_at_price, image_url, is_featured, is_published, is_active, deleted_at,
      size_guide_override, seo_title, seo_description, category_id,
      categories ( id, name, slug ),
      product_images ( id, image_url, alt_text, display_order, is_primary ),
      product_variants (
        id, sku, size, color, stock, stock_quantity, reserved_quantity,
        selling_price, compare_at_price, is_active, deleted_at,
        sizes ( id, code, name_ar, display_order ),
        colors ( id, code, name_ar, hex_code ),
        inventory_balances ( physical_qty, reserved_qty, available_qty )
      )
    `
    )
    .eq("slug", cleanSlug)
    .is("deleted_at", null)
    .single();

  if (error || !product) {
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching product by slug:", error.message);
    }
    return null;
  }

  if (!isProductVisibleInStore(product as Record<string, unknown>)) {
    return null;
  }

  const displayName = String(product.name || product.title || "منتج");
  const basePrice = Number(product.base_price ?? product.price ?? 0);

  const rawImages = Array.isArray(product.product_images)
    ? product.product_images
    : [];

  const sortedImages = [...rawImages]
    .sort((a, b) => {
      if (Boolean(a.is_primary) !== Boolean(b.is_primary)) {
        return a.is_primary ? -1 : 1;
      }
      return Number(a.display_order ?? 0) - Number(b.display_order ?? 0);
    })
    .map((img) => ({
      id: String(img.id),
      image_url: String(img.image_url),
      alt_text: String(img.alt_text || displayName),
    }));

  if (
    sortedImages.length === 0 &&
    typeof product.image_url === "string" &&
    product.image_url.trim() !== ""
  ) {
    sortedImages.push({
      id: `primary-${product.id}`,
      image_url: product.image_url.trim(),
      alt_text: displayName,
    });
  }

  const rawVariants = Array.isArray(product.product_variants)
    ? product.product_variants
    : [];

  const activeVariants = rawVariants
    .filter((v) => v.is_active !== false && v.deleted_at === null)
    .map((v, index) => {
      const sizeObj = Array.isArray(v.sizes) ? v.sizes[0] : v.sizes;
      const colorObj = Array.isArray(v.colors) ? v.colors[0] : v.colors;

      const sizeCode = String(sizeObj?.code || v.size || "ONE");
      const sizeNameAr = String(sizeObj?.name_ar || v.size || sizeCode);
      const sizeId = String(sizeObj?.id || `size-${sizeCode}`);
      const sizeOrder = Number(sizeObj?.display_order ?? index);

      const colorNameAr = String(colorObj?.name_ar || v.color || "أساسي");
      const colorCode = String(colorObj?.code || v.color || colorNameAr);
      const colorId = String(colorObj?.id || `color-${colorCode}`);
      const colorHex = String(colorObj?.hex_code || "#111827");

      const variantPrice = Number(v.selling_price ?? basePrice);
      const availableQty = extractVariantAvailableQty(v as Record<string, unknown>);

      return {
        id: String(v.id),
        sku: String(v.sku),
        selling_price:
          !Number.isNaN(variantPrice) && variantPrice > 0 ? variantPrice : basePrice,
        compare_at_price:
          v.compare_at_price !== null && v.compare_at_price !== undefined
            ? Number(v.compare_at_price)
            : null,
        size: {
          id: sizeId,
          code: sizeCode,
          name_ar: sizeNameAr,
          display_order: sizeOrder,
        },
        color: {
          id: colorId,
          code: colorCode,
          name_ar: colorNameAr,
          hex_code: colorHex,
        },
        available_qty: availableQty,
      };
    });

  let relatedProducts: CatalogProductSummary[] = [];
  if (isValidUuid(product.category_id)) {
    const { data: relatedRaw } = await supabase
      .from("products")
      .select(PRODUCT_SUMMARY_SELECT)
      .is("deleted_at", null)
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .limit(4);

    relatedProducts = mapRawProductsToSummaries(relatedRaw ?? []);
  }

  const catObj = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;

  return {
    id: String(product.id),
    name: displayName,
    slug: String(product.slug),
    product_code: String(
      product.product_code || `PRD-${String(product.id).slice(0, 6)}`
    ),
    short_description:
      (product.short_description as string | null) ??
      (product.description as string | null) ??
      null,
    long_description:
      (product.long_description as string | null) ??
      (product.description as string | null) ??
      null,
    base_price: basePrice,
    compare_at_price:
      product.compare_at_price !== null &&
      product.compare_at_price !== undefined
        ? Number(product.compare_at_price)
        : null,
    size_guide_override: Array.isArray(product.size_guide_override)
      ? (product.size_guide_override as Array<{
          size: string;
          chest_cm: string;
          length_cm: string;
          shoulder_cm?: string;
        }>)
      : null,
    seo_title: (product.seo_title as string | null) ?? null,
    seo_description: (product.seo_description as string | null) ?? null,
    category: catObj
      ? {
          id: String(catObj.id),
          name: String(catObj.name),
          slug: String(catObj.slug),
        }
      : null,
    images: sortedImages,
    variants: activeVariants,
    relatedProducts,
  };
}

export async function getActiveBanners() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("❌ خطأ في جلب البانرات:", error.message);
    } else {
      console.warn("⚠️ لم يتم العثور على بانرات نشطة، سيتم استخدام البانر الاحتياطي.");
    }
    
    return [{
      id: "fallback-banner",
      title: "تشكيلة الصيف الجديدة وصلت!",
      subtitle: "اكتشف أحدث صيحات الموضة بخصومات تصل إلى 30% وخامات قطنية مريحة.",
      image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop",
      cta_text: "تسوق الآن",
      cta_link: "/products",
      is_active: true,
      display_order: 0
    }];
  }

  return data;
}

// ✅ الدالة الجديدة لجلب التقييمات
export async function getProductReviews(productId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, comment, created_at")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error.message);
    return [];
  }

  return data || [];
}