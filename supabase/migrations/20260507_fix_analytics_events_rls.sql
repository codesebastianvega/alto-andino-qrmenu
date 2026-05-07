ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO anon;

DROP POLICY IF EXISTS "Public can insert analytics events" ON public.analytics_events;
CREATE POLICY "Public can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  brand_id IS NOT NULL
  AND (
    location_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.locations
      WHERE locations.id = analytics_events.location_id
        AND locations.brand_id = analytics_events.brand_id
    )
  )
);

DROP POLICY IF EXISTS "Brand managers can view analytics events" ON public.analytics_events;
CREATE POLICY "Brand managers can view analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.is_brand_manager(brand_id));
