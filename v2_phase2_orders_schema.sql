-- ==========================================
-- V2 PHASE 2: Orders & KDS Schema
-- ==========================================

-- Clean up existing tables to avoid cached schema issues during dev
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;

-- 1. Create Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
    origin TEXT NOT NULL DEFAULT 'table' CHECK (origin IN ('table', 'takeaway', 'whatsapp')),
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ready_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for public on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for public on order_items" ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for public on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable select for public on order_items" ON public.order_items FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users on orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on order_items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime for orders
-- It is recommended to enable this via the Supabase Dashboard:
-- Database -> Replication -> Click '0 tables' next to supabase_realtime -> Toggle 'orders' table
