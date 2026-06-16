-- Ingredient category names must be unique per brand, not globally.
-- The previous global constraint blocks new businesses from creating common
-- categories such as "Materias Primas" if another brand already used them.

ALTER TABLE public.ingredient_categories
  DROP CONSTRAINT IF EXISTS ingredient_categories_name_key;

DROP INDEX IF EXISTS public.ingredient_categories_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS ingredient_categories_brand_name_unique_idx
  ON public.ingredient_categories (brand_id, lower(name))
  WHERE brand_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ingredient_categories_global_name_unique_idx
  ON public.ingredient_categories (lower(name))
  WHERE brand_id IS NULL;
