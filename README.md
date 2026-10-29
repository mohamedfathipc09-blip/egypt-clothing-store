# متجر الملابس الرسمي (E-Commerce Storefront & Admin)

منصة تجارة إلكترونية متكاملة لبيع الملابس والأزياء، مبنية باستخدام **Next.js 14 (App Router)** و **Supabase** و **Tailwind CSS**، ومصممة للسوق المصري مع دعم الدفع عند الاستلام وإدارة المخزون الفعلي لحظياً.

## 🚀 المميزات الرئيسية
- **واجهة متجر سريعة وديناميكية:** عرض أحدث المنتجات، الأكثر مبيعاً، والعروض النشطة مع تحديث لحظي (`force-dynamic`).
- **نظام متغيرات متقدم (Variants):** دعم كامل للمقاسات (`sizes`) والألوان (`colors`) مع حساب الرصيد الفعلي المتاح لكل قطعة.
- **مزامنة تلقائية للمخزون:** مشغل قاعدة بيانات (`Trigger`) يربط بين التعديلات في لوحة الإدارة وجدول أرصدة المخزون (`inventory_balances`).
- **لوحة تحكم شاملة (`/admin`):** إدارة المنتجات، الأقسام، الطلبات، وإعدادات المتجر والسياسات.

## 🛠️ التقنيات المستخدمة
- **Frontend & Framework:** Next.js 14, React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Triggers).

## 🗄️ هيكلية قاعدة البيانات الأساسية (Database Schema)
يعتمد الكتالوج على الجداول المترابطة التالية في مخطط `public`:
- `store_settings`: الإعدادات العامة، البانرات، ألوان الهوية، وسياسات الاسترجاع والشحن.
- `categories`: الأقسام الرئيسية للمتجر.
- `products`: البيانات الأساسية للمنتجات (`name`, `slug`, `product_code`, `base_price`, `is_published`).
- `product_images`: صور المنتجات مرتبة حسب الأولوية (`is_primary`, `display_order`).
- `sizes` & `colors`: جداول مرجعية للمقاسات والألوان القياسية.
- `product_variants`: تركيبات المنتج (ربط المنتج بالمقاس واللون والسعر).
- `inventory_balances`: الرصيد الفعلي (`physical_qty`)، المحجوز (`reserved_qty`)، والمتاح للبيع (`available_qty`).

## ⚙️ تشغيل المشروع محلياً

1. تثبيت الحزم:
   ```bash
   npm install