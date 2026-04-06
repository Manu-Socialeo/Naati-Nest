export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          phone: string | null
          email: string | null
          role: string
          visit_count: number | null
          first_visit: string | null
          last_visit: string | null
          total_spent: number | null
          total_orders: number | null
          favourite_item: string | null
          admin_pin: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          phone?: string | null
          email?: string | null
          role?: string
          visit_count?: number | null
          first_visit?: string | null
          last_visit?: string | null
          total_spent?: number | null
          total_orders?: number | null
          favourite_item?: string | null
          admin_pin?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          phone?: string | null
          email?: string | null
          role?: string
          visit_count?: number | null
          first_visit?: string | null
          last_visit?: string | null
          total_spent?: number | null
          total_orders?: number | null
          favourite_item?: string | null
          admin_pin?: string | null
          created_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          name_kn: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          name_kn?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          name_kn?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string | null
          name: string
          name_kn: string | null
          description: string | null
          description_kn: string | null
          price: number
          image_url: string | null
          is_available: boolean | null
          is_veg: boolean | null
          is_bestseller: boolean | null
          is_todays_special: boolean | null
          has_variants: boolean | null
          variants: Json | null
          rating: number | null
          rating_count: string | null
          total_ordered: number | null
          sort_order: number | null
          available_from: string | null
          available_until: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          name_kn?: string | null
          description?: string | null
          description_kn?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean | null
          is_veg?: boolean | null
          is_bestseller?: boolean | null
          is_todays_special?: boolean | null
          has_variants?: boolean | null
          variants?: Json | null
          rating?: number | null
          rating_count?: string | null
          total_ordered?: number | null
          sort_order?: number | null
          available_from?: string | null
          available_until?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          name_kn?: string | null
          description?: string | null
          description_kn?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean | null
          is_veg?: boolean | null
          is_bestseller?: boolean | null
          is_todays_special?: boolean | null
          has_variants?: boolean | null
          variants?: Json | null
          rating?: number | null
          rating_count?: string | null
          total_ordered?: number | null
          sort_order?: number | null
          available_from?: string | null
          available_until?: string | null
          created_at?: string | null
        }
      }
      restaurant_settings: {
        Row: {
          id: string
          name: string | null
          tagline_en: string | null
          tagline_kn: string | null
          whatsapp_number: string | null
          is_open: boolean | null
          opened_at: string | null
          closed_at: string | null
          parcel_charge: number | null
        }
        Insert: {
          id?: string
          name?: string | null
          tagline_en?: string | null
          tagline_kn?: string | null
          whatsapp_number?: string | null
          is_open?: boolean | null
          opened_at?: string | null
          closed_at?: string | null
          parcel_charge?: number | null
        }
        Update: {
          id?: string
          name?: string | null
          tagline_en?: string | null
          tagline_kn?: string | null
          whatsapp_number?: string | null
          is_open?: boolean | null
          opened_at?: string | null
          closed_at?: string | null
          parcel_charge?: number | null
        }
      }
      tables: {
        Row: {
          id: string
          table_number: number
          label: string | null
          qr_code: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          table_number: number
          label?: string | null
          qr_code?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          table_number?: number
          label?: string | null
          qr_code?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          token: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          items: Json
          subtotal: number
          parcel_charge: number | null
          total_amount: number
          order_type: string | null
          status: string | null
          payment_status: string | null
          payment_method: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          scheduled_for: string | null
          tip_amount: number | null
          table_id: string | null
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          token?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          items: Json
          subtotal?: number
          parcel_charge?: number | null
          total_amount: number
          order_type?: string | null
          status?: string | null
          payment_status?: string | null
          payment_method?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          scheduled_for?: string | null
          tip_amount?: number | null
          table_id?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          token?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          items?: Json
          subtotal?: number
          parcel_charge?: number | null
          total_amount?: number
          order_type?: string | null
          status?: string | null
          payment_status?: string | null
          payment_method?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          scheduled_for?: string | null
          tip_amount?: number | null
          table_id?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
        }
      }
      order_ratings: {
        Row: {
          id: string
          order_id: string | null
          food_rating: number | null
          service_rating: number | null
          feedback: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          food_rating?: number | null
          service_rating?: number | null
          feedback?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          food_rating?: number | null
          service_rating?: number | null
          feedback?: string | null
          created_at?: string | null
        }
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image_url: string | null
          link_url: string | null
          is_active: boolean | null
          sort_order: number | null
          starts_at: string | null
          ends_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url?: string | null
          link_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          image_url?: string | null
          link_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string | null
        }
      }
    }
  }
}
