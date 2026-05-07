ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  brand_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.brand_id = order_items.brand_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = order_items.product_id
      AND products.brand_id = order_items.brand_id
  )
);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items"
ON public.order_items
FOR SELECT
TO anon, authenticated
USING (true);
