-- Fix bootstrap policies for first-time owner signup.
-- The initial brand insert must be allowed when owner_id = auth.uid(),
-- and the initial profile row must be insertable by the authenticated user.

DROP POLICY IF EXISTS "secure_admin_manage_brands" ON public.brands;
CREATE POLICY "secure_admin_manage_brands" ON public.brands
FOR ALL
TO authenticated
USING (public.is_brand_manager(id))
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_brand_manager(id)
);

DROP POLICY IF EXISTS "Users create their own profile" ON public.profiles;
CREATE POLICY "Users create their own profile" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users read their own profile during signup" ON public.profiles;
CREATE POLICY "Users read their own profile during signup" ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update their own profile during signup" ON public.profiles;
CREATE POLICY "Users update their own profile during signup" ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
