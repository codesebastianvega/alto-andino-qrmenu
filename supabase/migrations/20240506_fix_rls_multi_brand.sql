-- 1. Create robust permission helper function
CREATE OR REPLACE FUNCTION public.is_brand_manager(target_brand_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
  ) OR EXISTS (
    SELECT 1 FROM public.brands
    WHERE id = target_brand_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update brands update policy
DROP POLICY IF EXISTS "Admins can update their own brand" ON public.brands;
CREATE POLICY "Admins can update their own brand" ON public.brands
FOR UPDATE USING (is_brand_manager(id))
WITH CHECK (is_brand_manager(id));

-- 3. Update restaurant_settings policies
DROP POLICY IF EXISTS "Admins can manage their own brand's restaurant settings" ON public.restaurant_settings;
CREATE POLICY "Admins can manage their own brand's restaurant settings" ON public.restaurant_settings
FOR ALL USING (is_brand_manager(brand_id))
WITH CHECK (is_brand_manager(brand_id));

-- 4. Update home_settings policies
DROP POLICY IF EXISTS "Admins can manage their own brand's home settings" ON public.home_settings;
CREATE POLICY "Admins can manage their own brand's home settings" ON public.home_settings
FOR ALL USING (is_brand_manager(brand_id))
WITH CHECK (is_brand_manager(brand_id));

-- 5. Update categories policies
DROP POLICY IF EXISTS "Admins can manage their own brand's categories" ON public.categories;
CREATE POLICY "Admins can manage their own brand's categories" ON public.categories
FOR ALL USING (is_brand_manager(brand_id))
WITH CHECK (is_brand_manager(brand_id));

-- 6. Update products policies
DROP POLICY IF EXISTS "Admins can manage their own brand's products" ON public.products;
CREATE POLICY "Admins can manage their own brand's products" ON public.products
FOR ALL USING (is_brand_manager(brand_id))
WITH CHECK (is_brand_manager(brand_id));

-- 7. Update orders policies
DROP POLICY IF EXISTS "Admins can manage their own brand's orders" ON public.orders;
CREATE POLICY "Admins can manage their own brand's orders" ON public.orders
FOR ALL USING (is_brand_manager(brand_id))
WITH CHECK (is_brand_manager(brand_id));

-- 8. Update storage policies (Branding assets)
DROP POLICY IF EXISTS "Admins can upload branding assets" ON storage.objects;
CREATE POLICY "Admins can upload branding assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  (bucket_id = 'products'::text) AND 
  (split_part(name, '/'::text, 1) = 'branding'::text) AND 
  is_brand_manager((split_part(name, '/'::text, 2))::uuid)
);

DROP POLICY IF EXISTS "Admins can manage their branding assets" ON storage.objects;
CREATE POLICY "Admins can manage their branding assets" ON storage.objects
FOR ALL TO authenticated
USING (
  (bucket_id = 'products'::text) AND 
  (split_part(name, '/'::text, 1) = 'branding'::text) AND 
  is_brand_manager((split_part(name, '/'::text, 2))::uuid)
)
WITH CHECK (
  (bucket_id = 'products'::text) AND 
  (split_part(name, '/'::text, 1) = 'branding'::text) AND 
  is_brand_manager((split_part(name, '/'::text, 2))::uuid)
);
