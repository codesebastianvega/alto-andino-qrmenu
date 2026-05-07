DELETE FROM public.location_product_prices a
USING public.location_product_prices b
WHERE a.id > b.id
  AND a.location_id = b.location_id
  AND a.product_id = b.product_id;

DELETE FROM public.location_product_status a
USING public.location_product_status b
WHERE a.id > b.id
  AND a.location_id = b.location_id
  AND a.product_id = b.product_id;

ALTER TABLE public.location_product_prices
  ADD CONSTRAINT location_product_prices_location_product_key
  UNIQUE (location_id, product_id);

ALTER TABLE public.location_product_status
  ADD CONSTRAINT location_product_status_location_product_key
  UNIQUE (location_id, product_id);
