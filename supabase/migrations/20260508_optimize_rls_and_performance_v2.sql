-- --- 1. GRANTS (Ensure roles have basic access) ---
GRANT SELECT, INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.modifier_groups TO anon, authenticated;
GRANT SELECT ON public.modifier_options TO anon, authenticated;
GRANT SELECT ON public.location_product_prices TO anon, authenticated;
GRANT SELECT ON public.location_product_status TO anon, authenticated;
GRANT SELECT ON public.location_categories TO anon, authenticated;
GRANT SELECT ON public.location_modifier_groups TO anon, authenticated;
GRANT SELECT ON public.allergens TO anon, authenticated;

-- --- 2. SIMPLIFIED POLICIES (Fix 401/42501 errors) ---

-- Analytics Events
DROP POLICY IF EXISTS "Public can insert analytics events" ON public.analytics_events;
CREATE POLICY "Public can insert analytics events"
ON public.analytics_events FOR INSERT TO anon, authenticated
WITH CHECK (brand_id IS NOT NULL);

-- Orders
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders"
ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (brand_id IS NOT NULL);

-- Order Items
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items"
ON public.order_items FOR INSERT TO anon, authenticated
WITH CHECK (brand_id IS NOT NULL);

-- --- 3. MISSING PUBLIC SELECT POLICIES ---

-- Modifier Groups
DROP POLICY IF EXISTS "secure_public_read_modifier_groups" ON public.modifier_groups;
CREATE POLICY "secure_public_read_modifier_groups"
ON public.modifier_groups FOR SELECT TO anon, authenticated
USING (true);

-- Modifier Options
DROP POLICY IF EXISTS "secure_public_read_modifier_options" ON public.modifier_options;
CREATE POLICY "secure_public_read_modifier_options"
ON public.modifier_options FOR SELECT TO anon, authenticated
USING (true);

-- Location Product Prices
DROP POLICY IF EXISTS "secure_public_read_location_prices" ON public.location_product_prices;
CREATE POLICY "secure_public_read_location_prices"
ON public.location_product_prices FOR SELECT TO anon, authenticated
USING (true);

-- Location Product Status
DROP POLICY IF EXISTS "secure_public_read_location_status" ON public.location_product_status;
CREATE POLICY "secure_public_read_location_status"
ON public.location_product_status FOR SELECT TO anon, authenticated
USING (true);

-- Location Categories
DROP POLICY IF EXISTS "secure_public_read_location_categories" ON public.location_categories;
CREATE POLICY "secure_public_read_location_categories"
ON public.location_categories FOR SELECT TO anon, authenticated
USING (true);

-- Location Modifier Groups
DROP POLICY IF EXISTS "secure_public_read_location_modifier_groups" ON public.location_modifier_groups;
CREATE POLICY "secure_public_read_location_modifier_groups"
ON public.location_modifier_groups FOR SELECT TO anon, authenticated
USING (true);

-- Allergens (Ensure public access)
DROP POLICY IF EXISTS "secure_public_read_allergens" ON public.allergens;
CREATE POLICY "secure_public_read_allergens"
ON public.allergens FOR SELECT TO anon, authenticated
USING (true);

-- --- 4. PERFORMANCE INDEXES ---
-- Adding indexes to brand_id and location_id to speed up RLS and filtering

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_categories_brand_id ON public.categories(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON public.orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_brand_id ON public.analytics_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_locations_brand_id ON public.locations(brand_id);

CREATE INDEX IF NOT EXISTS idx_location_prices_location_id ON public.location_product_prices(location_id);
CREATE INDEX IF NOT EXISTS idx_location_status_location_id ON public.location_product_status(location_id);
CREATE INDEX IF NOT EXISTS idx_location_categories_location_id ON public.location_categories(location_id);
CREATE INDEX IF NOT EXISTS idx_location_mod_groups_location_id ON public.location_modifier_groups(location_id);
