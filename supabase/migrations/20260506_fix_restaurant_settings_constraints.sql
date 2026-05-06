-- Fix unique constraint on restaurant_settings to support per-location settings
ALTER TABLE public.restaurant_settings DROP CONSTRAINT IF EXISTS restaurant_settings_brand_id_key;
ALTER TABLE public.restaurant_settings ADD CONSTRAINT restaurant_settings_brand_location_key UNIQUE NULLS NOT DISTINCT (brand_id, location_id);

-- Fix business_hours unique constraint to prevent duplicates per day per location
ALTER TABLE public.business_hours DROP CONSTRAINT IF EXISTS business_hours_brand_location_day_key;
ALTER TABLE public.business_hours ADD CONSTRAINT business_hours_brand_location_day_key UNIQUE NULLS NOT DISTINCT (brand_id, location_id, day_of_week);
