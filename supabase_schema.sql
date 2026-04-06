-- ============================================
-- NAATI NEST - Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 0: Drop ALL existing policies on ALL tables
-- This ensures a clean slate regardless of previous state
-- ============================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================
-- 1. Tables
-- ============================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('customer','staff','admin')) DEFAULT 'customer',
    visit_count INTEGER DEFAULT 0,
    first_visit TIMESTAMPTZ DEFAULT now(),
    last_visit TIMESTAMPTZ DEFAULT now(),
    total_spent NUMERIC DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    favourite_item TEXT,
    admin_pin TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_kn TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    name_kn TEXT,
    description TEXT,
    description_kn TEXT,
    price NUMERIC NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_veg BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    is_todays_special BOOLEAN DEFAULT false,
    has_variants BOOLEAN DEFAULT false,
    variants JSONB DEFAULT '[]',
    rating NUMERIC DEFAULT 0,
    rating_count TEXT,
    total_ordered INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    available_from TIME,
    available_until TIME,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Restaurant Settings Table
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT DEFAULT 'Naati Nest',
    tagline_en TEXT,
    tagline_kn TEXT,
    whatsapp_number TEXT,
    is_open BOOLEAN DEFAULT true,
    opened_at TIME DEFAULT '09:00:00',
    closed_at TIME DEFAULT '22:00:00',
    parcel_charge NUMERIC DEFAULT 10
);

-- Tables (QR code per table)
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INTEGER NOT NULL UNIQUE,
    label TEXT,
    qr_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,
    customer_id UUID REFERENCES profiles(id),
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    parcel_charge NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    order_type TEXT CHECK (order_type IN ('dine-in','takeaway')) DEFAULT 'dine-in',
    status TEXT CHECK (status IN ('pending','preparing','ready','served','cancelled')) DEFAULT 'pending',
    payment_status TEXT CHECK (payment_status IN ('paid','pending')) DEFAULT 'paid',
    payment_method TEXT DEFAULT 'online',
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    scheduled_for TIMESTAMPTZ,
    tip_amount NUMERIC DEFAULT 0,
    table_id UUID REFERENCES tables(id),
    coupon_code TEXT,
    coupon_discount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Order Ratings & Feedback
CREATE TABLE IF NOT EXISTS order_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),
    service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Promotional Banners
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add extra columns to existing tables if they were created before
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_from TIME;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_until TIME;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_pin TEXT;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS label TEXT;

-- Clean duplicates BEFORE creating unique constraints
DO $$
BEGIN
  DELETE FROM menu_items WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY name, category_id ORDER BY created_at) as rn
      FROM menu_items
    ) t WHERE rn > 1
  );
  DELETE FROM categories WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
      FROM categories
    ) t WHERE rn > 1
  );
END $$;

-- Create unique constraints (outside CREATE TABLE so they always run)
CREATE UNIQUE INDEX IF NOT EXISTS uq_category_name ON categories(name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_item_name_category ON menu_items(name, category_id);

-- ============================================
-- 2. Helper Function (bypasses RLS to check role)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
DECLARE
    user_role text;
BEGIN
    SET LOCAL row_security = off;
    SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
    RETURN user_role;
END;
$$;

-- ============================================
-- 3. Row Level Security (RLS) Policies
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_select_staff" ON profiles FOR SELECT USING (public.get_user_role() IN ('staff', 'admin'));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (public.get_user_role() = 'admin');

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_all_staff" ON categories FOR ALL USING (public.get_user_role() IN ('staff', 'admin'));

-- Menu Items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_select" ON menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items_all_staff" ON menu_items FOR ALL USING (public.get_user_role() IN ('staff', 'admin'));

-- Restaurant Settings
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "settings_insert_staff" ON restaurant_settings FOR INSERT WITH CHECK (public.get_user_role() IN ('staff', 'admin'));
CREATE POLICY "settings_update_staff" ON restaurant_settings FOR UPDATE USING (public.get_user_role() IN ('staff', 'admin'));

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_update_staff" ON orders FOR UPDATE USING (public.get_user_role() IN ('staff', 'admin'));

-- Tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tables_select" ON tables FOR SELECT USING (true);
CREATE POLICY "tables_all_staff" ON tables FOR ALL USING (public.get_user_role() IN ('staff', 'admin'));

-- Order Ratings
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_select" ON order_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert" ON order_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "ratings_select_staff" ON order_ratings FOR SELECT USING (public.get_user_role() IN ('staff', 'admin'));

-- Banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners_select" ON banners FOR SELECT USING (true);
CREATE POLICY "banners_all_staff" ON banners FOR ALL USING (public.get_user_role() IN ('staff', 'admin'));

-- ============================================
-- 4. Triggers & Functions
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.generate_token()
RETURNS TRIGGER AS $$
DECLARE
    order_count INTEGER;
BEGIN
    SELECT count(*) INTO order_count FROM public.orders WHERE created_at::date = now()::date;
    new.token := 'T-' || LPAD((order_count + 1)::text, 3, '0');
    RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_order_insert ON public.orders;
CREATE TRIGGER before_order_insert
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_token();

CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'served' AND OLD.status != 'served' THEN
        UPDATE public.profiles
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount,
            last_visit = now()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_order_status_change ON public.orders;
CREATE TRIGGER after_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

CREATE OR REPLACE FUNCTION public.increment_item_ordered()
RETURNS TRIGGER AS $$
DECLARE
    item_record JSONB;
BEGIN
    IF NEW.status = 'served' AND OLD.status != 'served' THEN
        FOR item_record IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            UPDATE public.menu_items
            SET total_ordered = total_ordered + (item_record->>'quantity')::INTEGER
            WHERE id = (item_record->>'id')::UUID;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_order_served ON public.orders;
CREATE TRIGGER after_order_served
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.increment_item_ordered();

-- ============================================
-- 5. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_tables_number ON tables(table_number);
CREATE INDEX IF NOT EXISTS idx_order_ratings_order ON order_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort ON banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);

-- ============================================
-- 6. Storage Buckets
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('menu-photos', 'menu-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Drop ALL storage policies first
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "storage_menu_read" ON storage.objects FOR SELECT USING (bucket_id = 'menu-photos');
CREATE POLICY "storage_menu_all" ON storage.objects FOR ALL USING (bucket_id = 'menu-photos' AND public.get_user_role() IN ('staff', 'admin'));
CREATE POLICY "storage_banners_read" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "storage_banners_all" ON storage.objects FOR ALL USING (bucket_id = 'banners' AND public.get_user_role() IN ('staff', 'admin'));

-- ============================================
-- 7. Clean Duplicates and Seed Data
-- ============================================

-- Seed restaurant settings
INSERT INTO restaurant_settings (name, tagline_en, tagline_kn, whatsapp_number, is_open, opened_at, closed_at, parcel_charge)
VALUES ('Naati Nest', 'Authentic Non-Veg Cuisine', 'ಅಸಲಿ ನಾನ್-ವೆಜ್ ಖಾದ್ಯ', '+919999999999', true, '09:00:00', '22:00:00', 10)
ON CONFLICT (id) DO NOTHING;

-- Seed categories
INSERT INTO categories (name, name_kn, sort_order) VALUES
    ('Biryani & Rice', 'ಬಿರಿಯಾನಿ ಮತ್ತು ಅನ್ನ', 1),
    ('Starters', 'ಸ್ಟಾರ್ಟರ್ಸ್', 2),
    ('Kabab & More', 'ಕಬಾಬ್ ಮತ್ತು ಇತರೆ', 3),
    ('Combos', 'ಕಾಂಬೋಗಳು', 4),
    ('Idlis & Dosa', 'ಇಡ್ಲಿ ಮತ್ತು ದೋಸೆ', 5)
ON CONFLICT (name) DO NOTHING;

-- Seed menu items
INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Chicken Biryani', 'ಚಿಕನ್ ಬಿರಿಯಾನಿ', 129, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop', true, false, true, false, false, '[]', 4.8, '5K+' FROM categories WHERE name = 'Biryani & Rice'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Mutton Biryani', 'ಮಟನ್ ಬಿರಿಯಾನಿ', 269, 'https://images.unsplash.com/photo-1633945274405-b6c80a919169?q=80&w=400&auto=format&fit=crop', true, false, true, false, false, '[]', 4.7, '3.5K+' FROM categories WHERE name = 'Biryani & Rice'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Biryani Rice', 'ಬಿರಿಯಾನಿ ಅನ್ನ', 79, 'https://images.unsplash.com/photo-1536304993881-460e32f50a14?q=80&w=400&auto=format&fit=crop', true, false, false, false, false, '[]', 4.5, '4.7K+' FROM categories WHERE name = 'Biryani & Rice'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Chicken Leg Piece Biryani', 'ಚಿಕನ್ ಲೆಗ್ ಪೀಸ್ ಬಿರಿಯಾನಿ', 169, 'https://images.unsplash.com/photo-1606491956689-2ea866880049?q=80&w=400&auto=format&fit=crop', true, false, false, true, false, '[]', 4.6, '1.2K+' FROM categories WHERE name = 'Biryani & Rice'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Chicken Chops', 'ಚಿಕನ್ ಚಾಪ್ಸ್', 129, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.5, '2K+' FROM categories WHERE name = 'Starters'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Chilly Chicken', 'ಚಿಲ್ಲಿ ಚಿಕನ್', 129, 'https://images.unsplash.com/photo-1610057099443-fde6c99db9e1?q=80&w=400&auto=format&fit=crop', true, false, true, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.6, '3K+' FROM categories WHERE name = 'Starters'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Chicken Fry', 'ಚಿಕನ್ ಫ್ರೈ', 129, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.4, '1.5K+' FROM categories WHERE name = 'Starters'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Guntur Chicken', 'ಗುಂಟೂರು ಚಿಕನ್', 129, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.3, '1K+' FROM categories WHERE name = 'Starters'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Lemon Chicken', 'ಲೆಮನ್ ಚಿಕನ್', 129, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.5, '2.2K+' FROM categories WHERE name = 'Starters'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Pepper Chicken', 'ಪೆಪ್ಪರ್ ಚಿಕನ್', 129, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.4, '1.8K+' FROM categories WHERE name = 'Starters'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Chicken Sukka', 'ಚಿಕನ್ ಸುಕ್ಕಾ', 129, 'https://images.unsplash.com/photo-1567171466295-4afa63d45416?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.6, '2.5K+' FROM categories WHERE name = 'Starters'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Kabab', 'ಕಬಾಬ್', 110, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":110},{"id":"half","name":"Half","price":60}]', 4.3, '1.2K+' FROM categories WHERE name = 'Kabab & More'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Lollipop', 'ಲಾಲಿಪಾಪ್', 129, 'https://images.unsplash.com/photo-1562967916-eb82221dfb44?q=80&w=400&auto=format&fit=crop', true, false, false, false, true, '[{"id":"full","name":"Full","price":129},{"id":"half","name":"Half","price":79}]', 4.5, '2K+' FROM categories WHERE name = 'Kabab & More'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Chicken Combo', 'ಚಿಕನ್ ಕಾಂಬೋ', 159, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop', true, false, true, false, false, '[]', 4.6, '3K+' FROM categories WHERE name = 'Combos'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Mutton Combo', 'ಮಟನ್ ಕಾಂಬೋ', 229, 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop', true, false, false, false, false, '[]', 4.5, '1.8K+' FROM categories WHERE name = 'Combos'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Biryani Rice Combo', 'ಬಿರಿಯಾನಿ ಅನ್ನದ ಕಾಂಬೋ', 129, 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=400&auto=format&fit=crop', true, false, false, false, false, '[]', 4.4, '2.5K+' FROM categories WHERE name = 'Combos'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Dosa', 'ದೋಸೆ', 25, 'https://images.unsplash.com/photo-1630383249896-424e484df924?q=80&w=400&auto=format&fit=crop', true, true, false, false, false, '[]', 4.2, '1K+' FROM categories WHERE name = 'Idlis & Dosa'
ON CONFLICT (name, category_id) DO NOTHING;

INSERT INTO menu_items (category_id, name, name_kn, price, image_url, is_available, is_veg, is_bestseller, is_todays_special, has_variants, variants, rating, rating_count)
SELECT id, 'Idli', 'ಇಡ್ಲಿ', 25, 'https://images.unsplash.com/photo-1589301773859-b9af2f36a26e?q=80&w=400&auto=format&fit=crop', true, true, false, false, false, '[]', 4.3, '1.5K+' FROM categories WHERE name = 'Idlis & Dosa'
ON CONFLICT (name, category_id) DO NOTHING;
