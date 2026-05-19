-- Migration to configure cascade deleting for all tables referencing brands

-- 1. profiles (Set brand_id to NULL when the brand is deleted, preserving the user profile)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_brand_id_fkey,
  ADD CONSTRAINT profiles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- 2. staff
ALTER TABLE public.staff 
  DROP CONSTRAINT IF EXISTS staff_brand_id_fkey,
  ADD CONSTRAINT staff_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 3. experiences
ALTER TABLE public.experiences 
  DROP CONSTRAINT IF EXISTS experiences_brand_id_fkey,
  ADD CONSTRAINT experiences_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 4. restaurant_tables
ALTER TABLE public.restaurant_tables 
  DROP CONSTRAINT IF EXISTS restaurant_tables_brand_id_fkey,
  ADD CONSTRAINT restaurant_tables_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 5. business_hours
ALTER TABLE public.business_hours 
  DROP CONSTRAINT IF EXISTS business_hours_brand_id_fkey,
  ADD CONSTRAINT business_hours_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 6. promo_banners
ALTER TABLE public.promo_banners 
  DROP CONSTRAINT IF EXISTS promo_banners_brand_id_fkey,
  ADD CONSTRAINT promo_banners_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 7. home_settings
ALTER TABLE public.home_settings 
  DROP CONSTRAINT IF EXISTS home_settings_brand_id_fkey,
  ADD CONSTRAINT home_settings_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 8. allergens
ALTER TABLE public.allergens 
  DROP CONSTRAINT IF EXISTS allergens_brand_id_fkey,
  ADD CONSTRAINT allergens_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 9. recipes
ALTER TABLE public.recipes 
  DROP CONSTRAINT IF EXISTS recipes_brand_id_fkey,
  ADD CONSTRAINT recipes_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 10. ingredients
ALTER TABLE public.ingredients 
  DROP CONSTRAINT IF EXISTS ingredients_brand_id_fkey,
  ADD CONSTRAINT ingredients_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 11. ingredient_categories
ALTER TABLE public.ingredient_categories 
  DROP CONSTRAINT IF EXISTS ingredient_categories_brand_id_fkey,
  ADD CONSTRAINT ingredient_categories_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 12. modifiers
ALTER TABLE public.modifiers 
  DROP CONSTRAINT IF EXISTS modifiers_brand_id_fkey,
  ADD CONSTRAINT modifiers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 13. providers
ALTER TABLE public.providers 
  DROP CONSTRAINT IF EXISTS providers_brand_id_fkey,
  ADD CONSTRAINT providers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 14. restaurant_settings
ALTER TABLE public.restaurant_settings 
  DROP CONSTRAINT IF EXISTS restaurant_settings_brand_id_fkey,
  ADD CONSTRAINT restaurant_settings_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 15. orders
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_brand_id_fkey,
  ADD CONSTRAINT orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 16. order_payments
ALTER TABLE public.order_payments 
  DROP CONSTRAINT IF EXISTS order_payments_brand_id_fkey,
  ADD CONSTRAINT order_payments_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 17. leads
ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS leads_brand_id_fkey,
  ADD CONSTRAINT leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 18. order_items
ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_brand_id_fkey,
  ADD CONSTRAINT order_items_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 19. analytics_events
ALTER TABLE public.analytics_events 
  DROP CONSTRAINT IF EXISTS analytics_events_brand_id_fkey,
  ADD CONSTRAINT analytics_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 20. banners
ALTER TABLE public.banners 
  DROP CONSTRAINT IF EXISTS banners_brand_id_fkey,
  ADD CONSTRAINT banners_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 21. categories
ALTER TABLE public.categories 
  DROP CONSTRAINT IF EXISTS categories_brand_id_fkey,
  ADD CONSTRAINT categories_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 22. products
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_brand_id_fkey,
  ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 23. locations
ALTER TABLE public.locations 
  DROP CONSTRAINT IF EXISTS locations_brand_id_fkey,
  ADD CONSTRAINT locations_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 24. modifier_groups
ALTER TABLE public.modifier_groups 
  DROP CONSTRAINT IF EXISTS modifier_groups_brand_id_fkey,
  ADD CONSTRAINT modifier_groups_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 25. payment_methods
ALTER TABLE public.payment_methods 
  DROP CONSTRAINT IF EXISTS payment_methods_brand_id_fkey,
  ADD CONSTRAINT payment_methods_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 26. customers
ALTER TABLE public.customers 
  DROP CONSTRAINT IF EXISTS customers_brand_id_fkey,
  ADD CONSTRAINT customers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 27. table_areas
ALTER TABLE public.table_areas 
  DROP CONSTRAINT IF EXISTS table_areas_brand_id_fkey,
  ADD CONSTRAINT table_areas_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 28. shifts
ALTER TABLE public.shifts 
  DROP CONSTRAINT IF EXISTS shifts_brand_id_fkey,
  ADD CONSTRAINT shifts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;
