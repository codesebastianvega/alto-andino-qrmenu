ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.orders TO anon, authenticated;

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  brand_id IS NOT NULL
  AND (
    location_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.locations
      WHERE locations.id = orders.location_id
        AND locations.brand_id = orders.brand_id
    )
  )
  AND (
    table_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.restaurant_tables
      WHERE restaurant_tables.id = orders.table_id
        AND restaurant_tables.brand_id = orders.brand_id
        AND (
          orders.location_id IS NULL
          OR restaurant_tables.location_id = orders.location_id
        )
    )
  )
);

DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (true);
