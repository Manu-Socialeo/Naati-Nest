export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  visit_count: number;
  first_visit: string;
  last_visit: string;
  total_spent: number;
  total_orders: number;
  favourite_item: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_kn: string;
  sort_order: number;
  created_at: string;
}

export interface Variant {
  id: string;
  name: string;
  name_kn?: string;
  price: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  name_kn: string;
  description?: string;
  description_kn?: string;
  price: number;
  image_url: string;
  is_available: boolean;
  total_ordered: number;
  created_at: string;
  is_veg?: boolean;
  is_bestseller?: boolean;
  is_todays_special?: boolean;
  rating?: number;
  rating_count?: string;
  has_variants?: boolean;
  variants?: Variant[];
}

export interface Order {
  id: string;
  token: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  items: any[];
  total_amount: number;
  subtotal?: number;
  parcel_charge?: number;
  order_type?: 'dine-in' | 'takeaway';
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  payment_status: 'paid' | 'pending';
  payment_method: string;
  cancellation_reason: string;
  cancelled_by: string;
  created_at: string;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  tagline_en: string;
  tagline_kn: string;
  whatsapp_number: string;
  is_open: boolean;
  opened_at: string;
  closed_at: string;
}

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  selectedVariant?: Variant;
}
