-- Make destructive brand cleanup reliable for superadmin test data cleanup.
-- Direct brand_id relations already cascade; these indirect relations were still
-- blocking deletes when a brand had products, locations, recipes, or modifiers.

alter table public.location_categories
  drop constraint if exists location_categories_location_id_fkey,
  add constraint location_categories_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete cascade,
  drop constraint if exists location_categories_category_id_fkey,
  add constraint location_categories_category_id_fkey
    foreign key (category_id) references public.categories(id) on delete cascade;

alter table public.location_inventory
  drop constraint if exists location_inventory_location_id_fkey,
  add constraint location_inventory_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete cascade,
  drop constraint if exists location_inventory_product_id_fkey,
  add constraint location_inventory_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade,
  drop constraint if exists location_inventory_ingredient_id_fkey,
  add constraint location_inventory_ingredient_id_fkey
    foreign key (ingredient_id) references public.ingredients(id) on delete cascade;

alter table public.location_modifier_groups
  drop constraint if exists location_modifier_groups_location_id_fkey,
  add constraint location_modifier_groups_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete cascade,
  drop constraint if exists location_modifier_groups_modifier_group_id_fkey,
  add constraint location_modifier_groups_modifier_group_id_fkey
    foreign key (modifier_group_id) references public.modifier_groups(id) on delete cascade;

alter table public.location_payment_methods
  drop constraint if exists location_payment_methods_location_id_fkey,
  add constraint location_payment_methods_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete cascade,
  drop constraint if exists location_payment_methods_payment_method_id_fkey,
  add constraint location_payment_methods_payment_method_id_fkey
    foreign key (payment_method_id) references public.payment_methods(id) on delete cascade;

alter table public.location_product_prices
  drop constraint if exists location_product_prices_location_id_fkey,
  add constraint location_product_prices_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete cascade,
  drop constraint if exists location_product_prices_product_id_fkey,
  add constraint location_product_prices_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

alter table public.location_product_status
  drop constraint if exists location_product_status_location_id_fkey,
  add constraint location_product_status_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete cascade,
  drop constraint if exists location_product_status_product_id_fkey,
  add constraint location_product_status_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

alter table public.location_recipes
  drop constraint if exists location_recipes_location_id_fkey,
  add constraint location_recipes_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete cascade,
  drop constraint if exists location_recipes_recipe_id_fkey,
  add constraint location_recipes_recipe_id_fkey
    foreign key (recipe_id) references public.recipes(id) on delete cascade;

alter table public.modifier_options
  drop constraint if exists modifier_options_group_id_fkey,
  add constraint modifier_options_group_id_fkey
    foreign key (group_id) references public.modifier_groups(id) on delete cascade,
  drop constraint if exists modifier_options_nested_group_id_fkey,
  add constraint modifier_options_nested_group_id_fkey
    foreign key (nested_group_id) references public.modifier_groups(id) on delete set null,
  drop constraint if exists modifier_options_ingredient_id_fkey,
  add constraint modifier_options_ingredient_id_fkey
    foreign key (ingredient_id) references public.ingredients(id) on delete set null;

alter table public.product_ingredients
  drop constraint if exists product_ingredients_product_id_fkey,
  add constraint product_ingredients_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

alter table public.recipe_ingredients
  drop constraint if exists recipe_ingredients_recipe_id_fkey,
  add constraint recipe_ingredients_recipe_id_fkey
    foreign key (recipe_id) references public.recipes(id) on delete cascade,
  drop constraint if exists recipe_ingredients_ingredient_id_fkey,
  add constraint recipe_ingredients_ingredient_id_fkey
    foreign key (ingredient_id) references public.ingredients(id) on delete cascade,
  drop constraint if exists recipe_ingredients_product_id_fkey,
  add constraint recipe_ingredients_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null;

alter table public.experience_bookings
  drop constraint if exists experience_bookings_experience_id_fkey,
  add constraint experience_bookings_experience_id_fkey
    foreign key (experience_id) references public.experiences(id) on delete cascade;

alter table public.favorites
  drop constraint if exists favorites_product_id_fkey,
  add constraint favorites_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

alter table public.order_items
  drop constraint if exists order_items_order_id_fkey,
  add constraint order_items_order_id_fkey
    foreign key (order_id) references public.orders(id) on delete cascade;

alter table public.order_payments
  drop constraint if exists order_payments_order_id_fkey,
  add constraint order_payments_order_id_fkey
    foreign key (order_id) references public.orders(id) on delete cascade,
  drop constraint if exists order_payments_payment_method_id_fkey,
  add constraint order_payments_payment_method_id_fkey
    foreign key (payment_method_id) references public.payment_methods(id) on delete set null;

alter table public.promo_banners
  drop constraint if exists promo_banners_product_id_fkey,
  add constraint promo_banners_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null;

alter table public.products
  drop constraint if exists products_category_id_fkey,
  add constraint products_category_id_fkey
    foreign key (category_id) references public.categories(id) on delete set null,
  drop constraint if exists products_recipe_id_fkey,
  add constraint products_recipe_id_fkey
    foreign key (recipe_id) references public.recipes(id) on delete set null;

alter table public.ingredients
  drop constraint if exists ingredients_category_id_fkey,
  add constraint ingredients_category_id_fkey
    foreign key (category_id) references public.ingredient_categories(id) on delete set null,
  drop constraint if exists ingredients_provider_id_fkey,
  add constraint ingredients_provider_id_fkey
    foreign key (provider_id) references public.providers(id) on delete set null;

alter table public.orders
  drop constraint if exists orders_customer_id_fkey,
  add constraint orders_customer_id_fkey
    foreign key (customer_id) references public.customers(id) on delete set null,
  drop constraint if exists orders_location_id_fkey,
  add constraint orders_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null,
  drop constraint if exists orders_table_id_fkey,
  add constraint orders_table_id_fkey
    foreign key (table_id) references public.restaurant_tables(id) on delete set null,
  drop constraint if exists orders_waiter_id_fkey,
  add constraint orders_waiter_id_fkey
    foreign key (waiter_id) references public.staff(id) on delete set null;

alter table public.restaurant_settings
  drop constraint if exists restaurant_settings_location_id_fkey,
  add constraint restaurant_settings_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null;

alter table public.restaurant_tables
  drop constraint if exists restaurant_tables_location_id_fkey,
  add constraint restaurant_tables_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null,
  drop constraint if exists restaurant_tables_area_id_fkey,
  add constraint restaurant_tables_area_id_fkey
    foreign key (area_id) references public.table_areas(id) on delete set null;

alter table public.staff
  drop constraint if exists staff_location_id_fkey,
  add constraint staff_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null;

alter table public.shifts
  drop constraint if exists shifts_staff_id_fkey,
  add constraint shifts_staff_id_fkey
    foreign key (staff_id) references public.staff(id) on delete set null,
  drop constraint if exists shifts_location_id_fkey,
  add constraint shifts_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null;

alter table public.analytics_events
  drop constraint if exists analytics_events_location_id_fkey,
  add constraint analytics_events_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null;

alter table public.business_hours
  drop constraint if exists business_hours_location_id_fkey,
  add constraint business_hours_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null;

alter table public.leads
  drop constraint if exists leads_location_id_fkey,
  add constraint leads_location_id_fkey
    foreign key (location_id) references public.locations(id) on delete set null;
