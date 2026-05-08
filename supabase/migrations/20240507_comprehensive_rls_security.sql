-- 1. CLEANUP: Drop ALL existing policies in the public schema to avoid "already exists" errors
-- This block is more aggressive and handles potential casing issues.
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename, schemaname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. RE-DEFINE the security function (handles Superadmin and Brand Isolation)
-- SECURITY DEFINER ensures it runs with the privileges of the creator (postgres), bypassing RLS on tables it queries.
CREATE OR REPLACE FUNCTION public.is_brand_manager(target_brand_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_brand_id uuid;
BEGIN
  -- Get user info from profiles (bypasses RLS because of SECURITY DEFINER)
  SELECT role, brand_id INTO user_role, user_brand_id
  FROM public.profiles
  WHERE id = auth.uid();

  -- 1. Superadmin check
  IF user_role = 'superadmin' THEN
    RETURN TRUE;
  END IF;

  -- 2. Brand ownership check (explicit owner in brands table)
  IF EXISTS (
    SELECT 1 FROM public.brands
    WHERE id = target_brand_id
    AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Brand role check (from profiles table)
  IF user_brand_id = target_brand_id AND user_role IN ('owner', 'manager', 'staff') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. ENABLE RLS ON ALL TABLES
DO $$ 
DECLARE 
    tab RECORD;
BEGIN
    FOR tab IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tab.tablename);
    END LOOP;
END $$;

-- 4. APPLY COMPREHENSIVE POLICIES

-- --- CORE BRAND ACCESS (Direct brand_id) ---
DO $$
DECLARE
    table_name text;
    tables_with_brand_id text[] := ARRAY[
        'orders', 'order_items', 'products', 'categories', 'staff', 'ingredients', 'recipes', 
        'providers', 'restaurant_settings', 'restaurant_tables', 'banners', 'promo_banners', 
        'modifiers', 'ingredient_categories', 'allergens', 'experiences', 'business_hours', 
        'home_settings', 'locations', 'modifier_groups', 'payment_methods', 'order_payments', 
        'leads', 'analytics_events', 'customers', 'table_areas', 'shifts'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_brand_id
    LOOP
        -- Ensure we drop existing specifically named policy before creating
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'secure_admin_manage_' || table_name, table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_brand_manager(brand_id)) WITH CHECK (public.is_brand_manager(brand_id))', 
            'secure_admin_manage_' || table_name, table_name);
    END LOOP;
END $$;

-- --- SPECIAL CASE: brands table (brand_id is actually the id column) ---
DROP POLICY IF EXISTS "secure_admin_manage_brands" ON public.brands;
CREATE POLICY "secure_admin_manage_brands" ON public.brands FOR ALL TO authenticated USING (public.is_brand_manager(id)) WITH CHECK (public.is_brand_manager(id));

-- --- PUBLIC READ ACCESS (For QR Menu) ---
DROP POLICY IF EXISTS "secure_public_read_brands" ON public.brands;
CREATE POLICY "secure_public_read_brands" ON public.brands FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_products" ON public.products;
CREATE POLICY "secure_public_read_products" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_categories" ON public.categories;
CREATE POLICY "secure_public_read_categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_settings" ON public.restaurant_settings;
CREATE POLICY "secure_public_read_settings" ON public.restaurant_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "secure_public_read_tables" ON public.restaurant_tables;
CREATE POLICY "secure_public_read_tables" ON public.restaurant_tables FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_banners" ON public.banners;
CREATE POLICY "secure_public_read_banners" ON public.banners FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_promo_banners" ON public.promo_banners;
CREATE POLICY "secure_public_read_promo_banners" ON public.promo_banners FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_modifiers" ON public.modifiers;
CREATE POLICY "secure_public_read_modifiers" ON public.modifiers FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_experiences" ON public.experiences;
CREATE POLICY "secure_public_read_experiences" ON public.experiences FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_business_hours" ON public.business_hours;
CREATE POLICY "secure_public_read_business_hours" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "secure_public_read_home_settings" ON public.home_settings;
CREATE POLICY "secure_public_read_home_settings" ON public.home_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "secure_public_read_locations" ON public.locations;
CREATE POLICY "secure_public_read_locations" ON public.locations FOR SELECT TO anon, authenticated USING (is_active = true);

-- --- INDIRECT ACCESS (Tables linked via parents) ---
-- modifier_options (via modifier_groups)
DROP POLICY IF EXISTS "secure_admin_manage_modifier_options" ON public.modifier_options;
CREATE POLICY "secure_admin_manage_modifier_options" ON public.modifier_options FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.modifier_groups WHERE modifier_groups.id = modifier_options.group_id AND public.is_brand_manager(modifier_groups.brand_id)));

-- product_ingredients (via products)
DROP POLICY IF EXISTS "secure_admin_manage_product_ingredients" ON public.product_ingredients;
CREATE POLICY "secure_admin_manage_product_ingredients" ON public.product_ingredients FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND public.is_brand_manager(products.brand_id)));

-- recipe_ingredients (via recipes)
DROP POLICY IF EXISTS "secure_admin_manage_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "secure_admin_manage_recipe_ingredients" ON public.recipe_ingredients FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND public.is_brand_manager(recipes.brand_id)));

-- experience_bookings (via experiences)
DROP POLICY IF EXISTS "secure_admin_manage_experience_bookings" ON public.experience_bookings;
CREATE POLICY "secure_admin_manage_experience_bookings" ON public.experience_bookings FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.experiences WHERE experiences.id = experience_bookings.experience_id AND public.is_brand_manager(experiences.brand_id)));

-- Location Specific Tables (Linking via locations)
DO $$
DECLARE
    table_name text;
    loc_tables text[] := ARRAY[
        'location_product_prices', 'location_product_status', 'location_inventory', 
        'location_payment_methods', 'location_categories', 'location_recipes', 'location_modifier_groups'
    ];
BEGIN
    FOREACH table_name IN ARRAY loc_tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'secure_admin_manage_' || table_name, table_name);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.locations WHERE locations.id = %I.location_id AND public.is_brand_manager(locations.brand_id)))', 
            'secure_admin_manage_' || table_name, table_name, table_name);
    END LOOP;
END $$;

-- --- USER PRIVATE DATA ---
-- Profiles
DROP POLICY IF EXISTS "secure_user_self_manage_profile" ON public.profiles;
CREATE POLICY "secure_user_self_manage_profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "secure_admin_manage_profiles" ON public.profiles;
CREATE POLICY "secure_admin_manage_profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_brand_manager(brand_id)) WITH CHECK (public.is_brand_manager(brand_id));

-- Favorites
DROP POLICY IF EXISTS "secure_user_favorites" ON public.favorites;
CREATE POLICY "secure_user_favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders (Customer View & Guest Insert)
DROP POLICY IF EXISTS "secure_customer_view_own_orders" ON public.orders;
CREATE POLICY "secure_customer_view_own_orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "secure_public_insert_orders" ON public.orders;
CREATE POLICY "secure_public_insert_orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "secure_public_insert_order_items" ON public.order_items;
CREATE POLICY "secure_public_insert_order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- --- GLOBAL PLATFORM TABLES (Plans) ---
DROP POLICY IF EXISTS "secure_public_read_plans" ON public.plans;
CREATE POLICY "secure_public_read_plans" ON public.plans FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "secure_public_read_plan_features" ON public.plan_features;
CREATE POLICY "secure_public_read_plan_features" ON public.plan_features FOR SELECT TO anon, authenticated USING (true);

-- Write access to plans is Superadmin only
DROP POLICY IF EXISTS "secure_superadmin_manage_plans" ON public.plans;
CREATE POLICY "secure_superadmin_manage_plans" ON public.plans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'));

DROP POLICY IF EXISTS "secure_superadmin_manage_plan_features" ON public.plan_features;
CREATE POLICY "secure_superadmin_manage_plan_features" ON public.plan_features FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'));
