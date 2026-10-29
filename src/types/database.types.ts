export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_published: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_published?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_published?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      colors: {
        Row: {
          code: string
          hex_code: string | null
          id: string
          is_active: boolean | null
          name_ar: string
        }
        Insert: {
          code: string
          hex_code?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
        }
        Update: {
          code?: string
          hex_code?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          min_order_amount: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          min_order_amount?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          min_order_amount?: number
        }
        Relationships: []
      }
      inventory_balances: {
        Row: {
          available_qty: number
          id: string
          physical_qty: number
          reserved_qty: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          available_qty?: number
          id?: string
          physical_qty?: number
          reserved_qty?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          available_qty?: number
          id?: string
          physical_qty?: number
          reserved_qty?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balances_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_quantity: number
          order_id: string | null
          previous_quantity: number
          quantity_change: number
          reason: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_quantity: number
          order_id?: string | null
          previous_quantity: number
          quantity_change: number
          reason?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_quantity?: number
          order_id?: string | null
          previous_quantity?: number
          quantity_change?: number
          reason?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color_snapshot: string
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_title_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          color_snapshot: string
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_title_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          color_snapshot?: string
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_title_snapshot?: string
          quantity?: number
          size_snapshot?: string
          sku_snapshot?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string | null
          coupon_code: string | null
          created_at: string
          customer_alt_phone: string | null
          customer_name: string
          customer_phone: string
          delivery_notes: string | null
          discount_amount: number | null
          governorate: string | null
          id: string
          idempotency_key: string | null
          landmark: string | null
          notes: string | null
          order_number: string
          shipping_address: string
          shipping_fee: number
          shipping_zone_id: string | null
          status: string | null
          street_address: string | null
          subtotal: number | null
          subtotal_amount: number
          total_amount: number
          tracking_token: string | null
        }
        Insert: {
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_alt_phone?: string | null
          customer_name: string
          customer_phone: string
          delivery_notes?: string | null
          discount_amount?: number | null
          governorate?: string | null
          id?: string
          idempotency_key?: string | null
          landmark?: string | null
          notes?: string | null
          order_number: string
          shipping_address: string
          shipping_fee: number
          shipping_zone_id?: string | null
          status?: string | null
          street_address?: string | null
          subtotal?: number | null
          subtotal_amount: number
          total_amount: number
          tracking_token?: string | null
        }
        Update: {
          city?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_alt_phone?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_notes?: string | null
          discount_amount?: number | null
          governorate?: string | null
          id?: string
          idempotency_key?: string | null
          landmark?: string | null
          notes?: string | null
          order_number?: string
          shipping_address?: string
          shipping_fee?: number
          shipping_zone_id?: string | null
          status?: string | null
          street_address?: string | null
          subtotal?: number | null
          subtotal_amount?: number
          total_amount?: number
          tracking_token?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string
          color_id: string | null
          compare_at_price: number | null
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean | null
          product_id: string
          reserved_quantity: number
          selling_price: number | null
          size: string
          size_id: string | null
          sku: string
          stock: number
          stock_quantity: number | null
        }
        Insert: {
          color: string
          color_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          reserved_quantity?: number
          selling_price?: number | null
          size: string
          size_id?: string | null
          sku: string
          stock?: number
          stock_quantity?: number | null
        }
        Update: {
          color?: string
          color_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          reserved_quantity?: number
          selling_price?: number | null
          size?: string
          size_id?: string | null
          sku?: string
          stock?: number
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          long_description: string | null
          name: string | null
          price: number | null
          product_code: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          size_guide_override: Json | null
          slug: string
          title: string
          total_sold_count: number | null
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          long_description?: string | null
          name?: string | null
          price?: number | null
          product_code?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          size_guide_override?: Json | null
          slug: string
          title: string
          total_sold_count?: number | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          long_description?: string | null
          name?: string | null
          price?: number | null
          product_code?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          size_guide_override?: Json | null
          slug?: string
          title?: string
          total_sold_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      shipping_zones: {
        Row: {
          customer_shipping_fee: number
          display_order: number
          estimated_days: string
          estimated_delivery_days: string
          governorate: string
          governorate_code: string | null
          governorate_name_ar: string | null
          id: string
          is_active: boolean
          shipping_fee: number
          store_actual_shipping_cost: number
        }
        Insert: {
          customer_shipping_fee?: number
          display_order?: number
          estimated_days?: string
          estimated_delivery_days?: string
          governorate: string
          governorate_code?: string | null
          governorate_name_ar?: string | null
          id?: string
          is_active?: boolean
          shipping_fee?: number
          store_actual_shipping_cost?: number
        }
        Update: {
          customer_shipping_fee?: number
          display_order?: number
          estimated_days?: string
          estimated_delivery_days?: string
          governorate?: string
          governorate_code?: string | null
          governorate_name_ar?: string | null
          id?: string
          is_active?: boolean
          shipping_fee?: number
          store_actual_shipping_cost?: number
        }
        Relationships: []
      }
      sizes: {
        Row: {
          code: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name_ar: string
        }
        Insert: {
          code: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar: string
        }
        Update: {
          code?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_atomic: {
        Args: {
          p_city: string
          p_coupon_code?: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_notes?: string
          p_idempotency_key: string
          p_items?: Json
          p_landmark?: string
          p_shipping_zone_id: string
          p_street_address: string
          p_whatsapp_configured?: boolean
        }
        Returns: {
          order_number: string
          tracking_token: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
