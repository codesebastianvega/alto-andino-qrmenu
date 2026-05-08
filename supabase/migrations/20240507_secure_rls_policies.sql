-- Refined is_brand_manager function to handle multiple roles and superadmins
CREATE OR REPLACE FUNCTION public.is_brand_manager(target_brand_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_brand_id uuid;
BEGIN
  -- Get user info from profiles
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
  -- Allow owner, manager, and staff associated with this brand
  IF user_brand_id = target_brand_id AND user_role IN ('owner', 'manager', 'staff') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Secure ORDERS table
DROP POLICY IF EXISTS "Public orders" ON public.orders;
DROP POLICY IF EXISTS "Enable all for brand managers" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous order creation" ON public.orders;
DROP POLICY IF EXISTS "Allow customers to see their own orders" ON public.orders;

-- Policy for Admin/Staff access
CREATE POLICY "Admin/Staff manage orders" ON public.orders
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));

-- Policy for Customer read access
CREATE POLICY "Customers see their own orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = customer_id);

-- Policy for Public/Authenticated insertion (Guest checkout)
CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 2. Secure ORDER_ITEMS table
DROP POLICY IF EXISTS "Public order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin/Staff manage order items" ON public.order_items;

CREATE POLICY "Admin/Staff manage order items" ON public.order_items
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));

CREATE POLICY "Customers see their own order items" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert order items" ON public.order_items
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 3. Secure STAFF table
DROP POLICY IF EXISTS "Public staff" ON public.staff;
DROP POLICY IF EXISTS "Managers manage staff" ON public.staff;

CREATE POLICY "Managers manage staff" ON public.staff
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));

-- 4. Secure PROFILES table
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;

CREATE POLICY "Users see their own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users update their own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage profiles for their brand" ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));

-- 5. Secure INGREDIENTS and RECIPES (Internal data)
DROP POLICY IF EXISTS "Brand managers manage ingredients" ON public.ingredients;
CREATE POLICY "Brand managers manage ingredients" ON public.ingredients
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));

DROP POLICY IF EXISTS "Brand managers manage recipes" ON public.recipes;
CREATE POLICY "Brand managers manage recipes" ON public.recipes
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));

-- 6. Ensure PRODUCTS/CATEGORIES remain public for menu but protected for writes
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
    FOR ALL
    TO authenticated
    USING (public.is_brand_manager(brand_id))
    WITH CHECK (public.is_brand_manager(brand_id));
