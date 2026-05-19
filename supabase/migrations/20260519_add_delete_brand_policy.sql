-- Migration to add a DELETE policy for brands table to allow owners and superadmins to delete their own brand

DROP POLICY IF EXISTS "Owner or superadmin can DELETE brand" ON public.brands;
DROP POLICY IF EXISTS "Owner can DELETE own brand" ON public.brands;

CREATE POLICY "Owner or superadmin can DELETE brand" ON public.brands
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() 
    OR (auth.jwt() ->> 'role') = 'superadmin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
    OR user_role() = 'superadmin'
  );
