import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  // 1) تحقق من أن المستخدم admin
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return NextResponse.json({ error: "صلاحيات غير كافية" }, { status: 403 });
  }

  // 2) فلترة اختيارية
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");

  let query = service
    .from("orders")
    .select(
      `
      order_number,
      customer_name,
      customer_phone,
      customer_alt_phone,
      governorate,
      city,
      street_address,
      landmark,
      delivery_notes,
      shipping_fee,
      total_amount,
      status,
      created_at,
      order_items (
        product_title_snapshot,
        size_snapshot,
        color_snapshot,
        sku_snapshot,
        quantity,
        unit_price,
        line_total
      )
    `
    )
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }
  if (toDate) {
    // نهاية اليوم (23:59:59)
    query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3) بناء CSV
  const headers = [
    "رقم الطلب",
    "اسم العميل",
    "الهاتف",
    "هاتف بديل",
    "المحافظة",
    "المدينة",
    "العنوان",
    "علامة مميزة",
    "ملاحظات التوصيل",
    "المنتجات",
    "إجمالي المنتجات",
    "الشحن",
    "الإجمالي",
    "الحالة",
    "التاريخ",
  ];

  const rows = (orders ?? []).map((o: any) => {
    const items = Array.isArray(o.order_items) ? o.order_items : [];

    // ملخص المنتجات: "منتج1 (M/أسود) x2 | منتج2 (L/أبيض) x1"
    const itemsSummary = items
      .map(
        (it: any) =>
          `${it.product_title_snapshot || "منتج"} (${it.size_snapshot || "-"}/${it.color_snapshot || "-"}) × ${it.quantity}`
      )
      .join(" | ");

    const itemsSubtotal = items.reduce(
      (sum: number, it: any) => sum + Number(it.line_total || 0),
      0
    );

    return [
      o.order_number,
      o.customer_name,
      o.customer_phone,
      o.customer_alt_phone ?? "",
      o.governorate ?? "",
      o.city ?? "",
      o.street_address ?? "",
      o.landmark ?? "",
      o.delivery_notes ?? "",
      itemsSummary,
      itemsSubtotal.toFixed(2),
      Number(o.shipping_fee || 0).toFixed(2),
      Number(o.total_amount || 0).toFixed(2),
      translateStatus(String(o.status || "")),
      new Date(o.created_at).toLocaleString("ar-EG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    ];
  });

  // 4) تحويل إلى CSV مع escaping
  const escapeCell = (val: any): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n"); // Windows line endings

  // 5) BOM ضروري لكي يقرأ Excel العربية بشكل صحيح
  const bom = "\uFEFF";
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * ترجمة حالات الطلب إلى العربية
 */
function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "مؤكد",
    processing: "قيد التجهيز",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
    returned: "مرتجع",
  };
  return map[status] || status;
}