-- Enable common extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: public.brands
CREATE TABLE IF NOT EXISTS public.brands (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "config" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "owner_id" uuid,
    "is_active" boolean DEFAULT true,
    "logo_url" text,
    "description" text,
    "phone" text,
    "email" text,
    "address" text,
    "city" text,
    "country" text DEFAULT 'CO'::text,
    "whatsapp" text,
    "instagram" text,
    "updated_at" timestamp with time zone DEFAULT now(),
    "plan_id" uuid,
    "business_type" text,
    "onboarding_completed" boolean DEFAULT false,
    "google_maps_url" text,
    PRIMARY KEY ("id"),
    CONSTRAINT brands_business_type_check CHECK (business_type = ANY (ARRAY['restaurant'::text, 'cafe'::text, 'bakery'::text, 'dark_kitchen'::text, 'store'::text, 'other'::text]))
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    "id" uuid NOT NULL,
    "brand_id" uuid,
    "full_name" text,
    "role" text DEFAULT 'customer'::text,
    "dietary_preferences" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "avatar_url" text,
    "phone" text,
    PRIMARY KEY ("id"),
    CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['superadmin'::text, 'owner'::text, 'manager'::text, 'staff'::text, 'customer'::text]))
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Table: public.categories
CREATE TABLE IF NOT EXISTS public.categories (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "icon" text,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "banner_image_url" text,
    "banner_title" text,
    "banner_description" text,
    "accent_color" text DEFAULT '#2f4131'::text,
    "available_from" time without time zone,
    "available_to" time without time zone,
    "visibility_config" jsonb DEFAULT '{}'::jsonb,
    "tint_class" text,
    "target_id" text,
    PRIMARY KEY ("id")
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Table: public.products
CREATE TABLE IF NOT EXISTS public.products (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid,
    "category_id" uuid,
    "name" text NOT NULL,
    "description" text,
    "price" numeric NOT NULL DEFAULT 0,
    "cost" numeric NOT NULL DEFAULT 0,
    "margin" numeric NOT NULL DEFAULT 0,
    "stock_status" text DEFAULT 'in'::text,
    "stock_quantity" integer DEFAULT 0,
    "barcode" text,
    "image_url" text,
    "is_active" boolean DEFAULT true,
    "tags" text[] DEFAULT '{}'::text[],
    "created_at" timestamp with time zone DEFAULT now(),
    "variants" jsonb DEFAULT '[]'::jsonb,
    "modifier_groups" text[] DEFAULT '{}'::text[],
    "config_options" jsonb DEFAULT '{}'::jsonb,
    "is_addon" boolean DEFAULT false,
    "recipe_id" uuid,
    "sort_order" integer DEFAULT 0,
    "packaging_fee" numeric DEFAULT 0,
    "is_upsell" boolean DEFAULT false,
    "requires_kitchen" boolean DEFAULT true,
    "subcategory" text,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "brand_concept" text,
    "visibility_mode" text DEFAULT 'all'::text,
    PRIMARY KEY ("id"),
    CONSTRAINT products_stock_status_check CHECK (stock_status = ANY (ARRAY['in'::text, 'out'::text, 'low'::text])),
    CONSTRAINT products_visibility_mode_check CHECK (visibility_mode = ANY (ARRAY['all'::text, 'specific'::text]))
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.products."brand_concept" IS 'Concepto de marca al que pertenece el producto (ej. Delicattesen, Pizzeria, etc.)';

-- Table: public.product_ingredients
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "product_id" uuid,
    "ingredient_id" uuid,
    "quantity" numeric NOT NULL,
    PRIMARY KEY ("id")
);
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- Table: public.banners
CREATE TABLE IF NOT EXISTS public.banners (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid,
    "title" text,
    "copy" text,
    "cta_text" text,
    "cta_link" text,
    "image_url" text,
    "gradient_colors" text[] DEFAULT '{}'::text[],
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Table: public.favorites
CREATE TABLE IF NOT EXISTS public.favorites (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "product_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Table: public.modifiers
CREATE TABLE IF NOT EXISTS public.modifiers (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "price" numeric DEFAULT 0,
    "group" text NOT NULL,
    "description" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "brand_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;

-- Table: public.recipes
CREATE TABLE IF NOT EXISTS public.recipes (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "total_cost" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "target_price" numeric DEFAULT 0,
    "brand_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Table: public.recipe_ingredients
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "recipe_id" uuid,
    "product_id" uuid,
    "quantity" numeric NOT NULL DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT now(),
    "ingredient_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Table: public.ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "sku" text,
    "category" text,
    "purchase_price" numeric DEFAULT 0,
    "purchase_unit" text,
    "purchase_quantity" numeric DEFAULT 1,
    "usage_unit" text,
    "unit_cost" numeric DEFAULT 0,
    "stock_current" numeric DEFAULT 0,
    "stock_min" numeric DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "selling_price" numeric DEFAULT 0,
    "is_modifier" boolean DEFAULT false,
    "category_id" uuid,
    "portion_size" numeric DEFAULT 50,
    "provider_id" uuid,
    "brand_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- Table: public.ingredient_categories
CREATE TABLE IF NOT EXISTS public.ingredient_categories (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL UNIQUE,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "brand_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.ingredient_categories ENABLE ROW LEVEL SECURITY;

-- Table: public.providers
CREATE TABLE IF NOT EXISTS public.providers (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "contact_name" text,
    "phone" text,
    "email" text,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "delivery_days" text,
    "min_order_amount" numeric DEFAULT 0,
    "brand_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Table: public.allergens
CREATE TABLE IF NOT EXISTS public.allergens (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" character varying NOT NULL,
    "emoji" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "brand_id" uuid,
    "type" text DEFAULT 'allergen'::text,
    PRIMARY KEY ("id")
);
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.allergens."type" IS 'Categoría de la etiqueta: allergen o diet';

-- Table: public.restaurant_settings
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "business_name" character varying NOT NULL DEFAULT 'Alto Andino'::character varying,
    "primary_color" character varying NOT NULL DEFAULT '#7db87a'::character varying,
    "logo_url" text,
    "whatsapp_number_orders" character varying,
    "updated_at" timestamp with time zone DEFAULT now(),
    "is_service_fee_enabled" boolean DEFAULT false,
    "service_fee_percentage" integer DEFAULT 10,
    "theme_secondary" text DEFAULT '#E6B05C'::text,
    "theme_background" text DEFAULT '#FAFAFA'::text,
    "theme_card_bg" text DEFAULT '#FFFFFF'::text,
    "theme_text" text DEFAULT '#1A1A1A'::text,
    "theme_footer_bg" text DEFAULT '#1A2421'::text,
    "favicon_url" text DEFAULT ''::text,
    "brand_id" uuid UNIQUE,
    "font_family" text DEFAULT 'Inter'::text,
    "pay_before_service" boolean DEFAULT false,
    "payment_requirement_stage" text DEFAULT 'none'::text,
    "legal_name" text,
    "legal_id" text,
    "brand_concepts" jsonb DEFAULT '[]'::jsonb,
    "location_id" uuid,
    "hide_sales_from_staff" boolean DEFAULT false,
    "inactivity_threshold_mins" integer DEFAULT 30,
    "target_prep_time_mins" integer DEFAULT 15,
    PRIMARY KEY ("id"),
    CONSTRAINT restaurant_settings_payment_requirement_stage_check CHECK (payment_requirement_stage = ANY (ARRAY['none'::text, 'pre_preparation'::text, 'pre_delivery'::text]))
);
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.restaurant_settings."brand_concepts" IS 'List of brand concepts: { name, description, image_url, color }';

-- Table: public.restaurant_tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "table_number" character varying NOT NULL,
    "qr_code_url" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "brand_id" uuid,
    "physical_status" text DEFAULT 'libre'::text,
    "occupied_at" timestamp with time zone,
    "area_id" uuid,
    "location_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Table: public.orders
CREATE TABLE IF NOT EXISTS public.orders (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "status" text NOT NULL DEFAULT 'new'::text,
    "origin" text NOT NULL DEFAULT 'table'::text,
    "table_id" uuid,
    "customer_name" text,
    "customer_phone" text,
    "total_amount" numeric NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "ready_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "fulfillment_type" text DEFAULT 'dine_in'::text,
    "scheduled_time" timestamp with time zone,
    "payment_status" text DEFAULT 'pending'::text,
    "payment_method" text,
    "cancelled_by" text,
    "cancellation_reason" text,
    "cancelled_at" timestamp with time zone,
    "waiter_id" uuid,
    "service_fee" numeric DEFAULT 0,
    "brand_id" uuid,
    "discount_amount" numeric DEFAULT 0,
    "discount_reason" text,
    "paid_amount" numeric DEFAULT 0,
    "customer_id" uuid,
    "location_id" uuid,
    PRIMARY KEY ("id"),
    CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['waiting_payment'::text, 'new'::text, 'preparing'::text, 'ready'::text, 'on_table'::text, 'delivered'::text, 'cancelled'::text])),
    CONSTRAINT orders_origin_check CHECK (origin = ANY (ARRAY['table'::text, 'takeaway'::text, 'whatsapp'::text]))
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.orders."fulfillment_type" IS 'dine_in, takeaway, delivery, scheduled';
COMMENT ON COLUMN public.orders."payment_status" IS 'pending, paid, failed, refunded';

-- Table: public.order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "order_id" uuid NOT NULL,
    "product_id" uuid NOT NULL,
    "quantity" integer NOT NULL DEFAULT 1,
    "unit_price" numeric NOT NULL DEFAULT 0,
    "modifiers" jsonb DEFAULT '[]'::jsonb,
    "notes" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "is_paid" boolean DEFAULT false,
    "brand_id" uuid,
    PRIMARY KEY ("id"),
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0)
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Table: public.staff
CREATE TABLE IF NOT EXISTS public.staff (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "role" text NOT NULL,
    "pin" character varying NOT NULL,
    "brand_id" uuid,
    "location_id" uuid,
    "is_active" boolean DEFAULT true,
    "access_all_locations" boolean DEFAULT false,
    "location_ids" uuid[] DEFAULT '{}'::uuid[],
    "commission_rate" numeric DEFAULT 0,
    PRIMARY KEY ("id"),
    CONSTRAINT staff_role_check CHECK (role = ANY (ARRAY['admin'::text, 'waiter'::text, 'kitchen'::text, 'cashier'::text, 'promoter'::text]))
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.staff."commission_rate" IS 'Commission percentage for promoters (impulsadores)';

-- Table: public.experiences
CREATE TABLE IF NOT EXISTS public.experiences (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "description" text,
    "short_description" text,
    "type" text DEFAULT 'event'::text,
    "price" numeric NOT NULL DEFAULT 0,
    "capacity" integer NOT NULL DEFAULT 10,
    "duration_minutes" integer DEFAULT 60,
    "image_url" text,
    "gallery_urls" text[],
    "includes" text[],
    "location" text,
    "is_active" boolean DEFAULT true,
    "is_recurring" boolean DEFAULT false,
    "recurrence_rule" text,
    "next_date" timestamp with time zone,
    "dates" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "brand_id" uuid,
    PRIMARY KEY ("id"),
    CONSTRAINT experiences_type_check CHECK (type = ANY (ARRAY['event'::text, 'workshop'::text, 'tasting'::text, 'tour'::text, 'dinner'::text, 'premium'::text]))
);
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Table: public.experience_bookings
CREATE TABLE IF NOT EXISTS public.experience_bookings (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "experience_id" uuid,
    "customer_name" text NOT NULL,
    "customer_phone" text,
    "customer_email" text,
    "guests" integer DEFAULT 1,
    "selected_date" timestamp with time zone NOT NULL,
    "status" text DEFAULT 'confirmed'::text,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "payment_status" text DEFAULT 'pending'::text,
    PRIMARY KEY ("id"),
    CONSTRAINT experience_bookings_status_check CHECK (status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text])),
    CONSTRAINT experience_bookings_payment_status_check CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text]))
);
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;

-- Table: public.business_hours
CREATE TABLE IF NOT EXISTS public.business_hours (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "day_of_week" integer NOT NULL,
    "open_time" time without time zone,
    "close_time" time without time zone,
    "is_closed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "brand_id" uuid NOT NULL,
    "location_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Table: public.promo_banners
CREATE TABLE IF NOT EXISTS public.promo_banners (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "title" text,
    "subtitle" text,
    "image_url" text,
    "cta_text" text,
    "cta_link" text,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "type" text DEFAULT 'info'::text,
    "bg_color" text DEFAULT '#2f4131'::text,
    "product_id" uuid,
    "brand_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Table: public.home_settings
CREATE TABLE IF NOT EXISTS public.home_settings (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "hero_images" jsonb DEFAULT '[]'::jsonb,
    "featured_items" jsonb DEFAULT '[]'::jsonb,
    "reviews" jsonb DEFAULT '[]'::jsonb,
    "concierge_prompt_template" text DEFAULT 'Eres el ''Conserje Gastronómico'' del restaurante premium Alto Andino. Tono: casual pero experto, moderno. Cliente dice: \"{{query}}\". Recomienda productos de nuestro menú y explica por qué en máximo 2 líneas impactantes.'::text,
    "event_planner_prompt_template" text DEFAULT 'Eres el ''Curador de Experiencias'' de Alto Andino. Crea una propuesta de evento breve y moderna. Incluye: Nombre del evento y concepto de comida/espacio en 3 líneas máximo. Cliente dice: \"{{query}}\"'::text,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "hero_h1" text DEFAULT 'Descubre tus\nplatos favoritos'::text,
    "hero_subtitle" text DEFAULT 'Ingredientes locales, nutrición premium y el toque artesanal de nuestra cocina andina, directo a tu mesa.'::text,
    "hero_emojis" text DEFAULT '🥑,🌿'::text,
    "hero_background_image" text,
    "experiences_h1" text DEFAULT 'Vive Experiencias Inolvidables'::text,
    "experiences_subtitle" text DEFAULT 'Más allá de la comida, momentos que transforman.'::text,
    "featured_items_title" text,
    "experiences_img" text,
    "concierge_h1" text,
    "concierge_subtitle" text,
    "menu_banner_title" text,
    "menu_banner_subtitle" text,
    "menu_banner_tag" text,
    "menu_banner_img" text,
    "experiences_tag" text,
    "concierge_img" text,
    "concierge_bg_color" text,
    "event_planner_bg_color" text,
    "event_planner_h1" text,
    "event_planner_subtitle" text,
    "event_planner_img" text,
    "brand_id" uuid UNIQUE,
    "welcome_bg_img" text,
    PRIMARY KEY ("id")
);
ALTER TABLE public.home_settings ENABLE ROW LEVEL SECURITY;

-- Table: public.plans
CREATE TABLE IF NOT EXISTS public.plans (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "price_monthly" integer NOT NULL DEFAULT 0,
    "price_yearly" integer,
    "currency" text DEFAULT 'COP'::text,
    "is_custom_pricing" boolean DEFAULT false,
    "max_admins" integer DEFAULT 1,
    "max_products" integer,
    "max_categories" integer,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_highlighted" boolean DEFAULT false,
    "cta_text" text DEFAULT 'Empezar'::text,
    "cta_link" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Table: public.plan_features
CREATE TABLE IF NOT EXISTS public.plan_features (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL,
    "feature_key" text NOT NULL,
    "display_name" text NOT NULL,
    "description" text,
    "icon" text,
    "is_included" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Table: public.locations
CREATE TABLE IF NOT EXISTS public.locations (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid NOT NULL,
    "name" text NOT NULL,
    "address" text,
    "phone" text,
    "maps_url" text,
    "is_main" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "whatsapp" text,
    "operational_modes" text[] DEFAULT '{dine_in,takeaway}'::text[],
    "delivery_radius_km" numeric DEFAULT 5.0,
    "independent_payments" boolean DEFAULT false,
    "slug" text UNIQUE,
    PRIMARY KEY ("id")
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.locations."operational_modes" IS 'Modos permitidos: dine_in, takeaway, delivery';
COMMENT ON COLUMN public.locations."delivery_radius_km" IS 'Radio de entrega en kilómetros para geofencing';
COMMENT ON COLUMN public.locations."independent_payments" IS 'Si es true, la sede usa métodos de pago específicos en lugar de los de la marca';

-- Table: public.modifier_groups
CREATE TABLE IF NOT EXISTS public.modifier_groups (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "brand_id" uuid,
    "name" text NOT NULL,
    "description" text,
    "is_required" boolean DEFAULT false,
    "min_select" integer DEFAULT 0,
    "max_select" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT now(),
    "is_submodifier" boolean DEFAULT false,
    PRIMARY KEY ("id")
);
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;

-- Table: public.modifier_options
CREATE TABLE IF NOT EXISTS public.modifier_options (
    "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "group_id" uuid,
    "ingredient_id" uuid,
    "name" text NOT NULL,
    "price" numeric DEFAULT 0,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "nested_group_id" uuid,
    "image_url" text,
    "emoji" text,
    PRIMARY KEY ("id")
);
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

-- Table: public.payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid NOT NULL,
    "name" text NOT NULL,
    "icon" text,
    "type" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Table: public.order_payments
CREATE TABLE IF NOT EXISTS public.order_payments (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "order_id" uuid NOT NULL,
    "brand_id" uuid NOT NULL,
    "amount" numeric NOT NULL DEFAULT 0,
    "payment_method_id" uuid,
    "payment_method_name" text,
    "received_amount" numeric DEFAULT 0,
    "change_amount" numeric DEFAULT 0,
    "notes" text,
    "items_covered" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- Table: public.leads
CREATE TABLE IF NOT EXISTS public.leads (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "name" text,
    "email" text,
    "restaurant_name" text,
    "message" text,
    "status" text DEFAULT 'new'::text,
    "source" text DEFAULT 'landing_page'::text,
    "brand_id" uuid,
    "location_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Table: public.analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone DEFAULT now(),
    "event_name" text NOT NULL,
    "table_id" text,
    "session_id" uuid,
    "user_agent" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "location_id" uuid,
    "brand_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Table: public.customers
CREATE TABLE IF NOT EXISTS public.customers (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid NOT NULL,
    "phone" text NOT NULL,
    "name" text,
    "email" text,
    "notes" text,
    "tags" text[] DEFAULT '{}'::text[],
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Table: public.table_areas
CREATE TABLE IF NOT EXISTS public.table_areas (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid NOT NULL,
    "name" text NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "location_id" uuid,
    PRIMARY KEY ("id")
);
ALTER TABLE public.table_areas ENABLE ROW LEVEL SECURITY;

-- Table: public.location_product_prices
CREATE TABLE IF NOT EXISTS public.location_product_prices (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "location_id" uuid NOT NULL,
    "product_id" uuid NOT NULL,
    "price" numeric NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.location_product_prices ENABLE ROW LEVEL SECURITY;

-- Table: public.location_product_status
CREATE TABLE IF NOT EXISTS public.location_product_status (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "location_id" uuid NOT NULL,
    "product_id" uuid NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    "stock_status" text NOT NULL DEFAULT 'in'::text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT location_product_status_stock_status_check CHECK (stock_status = ANY (ARRAY['in'::text, 'out'::text, 'low'::text]))
);
ALTER TABLE public.location_product_status ENABLE ROW LEVEL SECURITY;

-- Table: public.location_inventory
CREATE TABLE IF NOT EXISTS public.location_inventory (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "location_id" uuid NOT NULL,
    "product_id" uuid,
    "ingredient_id" uuid,
    "stock_quantity" numeric NOT NULL DEFAULT 0,
    "min_stock" numeric NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.location_inventory ENABLE ROW LEVEL SECURITY;

-- Table: public.location_payment_methods
CREATE TABLE IF NOT EXISTS public.location_payment_methods (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "location_id" uuid NOT NULL,
    "payment_method_id" uuid NOT NULL,
    "is_active" boolean DEFAULT true,
    "config" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.location_payment_methods ENABLE ROW LEVEL SECURITY;

-- Table: public.location_categories
CREATE TABLE IF NOT EXISTS public.location_categories (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "location_id" uuid,
    "category_id" uuid,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY ("id")
);
ALTER TABLE public.location_categories ENABLE ROW LEVEL SECURITY;

-- Table: public.location_recipes
CREATE TABLE IF NOT EXISTS public.location_recipes (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "location_id" uuid NOT NULL,
    "recipe_id" uuid NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.location_recipes ENABLE ROW LEVEL SECURITY;

-- Table: public.location_modifier_groups
CREATE TABLE IF NOT EXISTS public.location_modifier_groups (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "location_id" uuid NOT NULL,
    "modifier_group_id" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.location_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Table: public.shifts
CREATE TABLE IF NOT EXISTS public.shifts (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid,
    "staff_id" uuid,
    "location_id" uuid,
    "clock_in" timestamp with time zone DEFAULT now(),
    "clock_out" timestamp with time zone,
    "total_minutes" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Foreign Key Constraints
ALTER TABLE "public"."business_hours" 
    ADD CONSTRAINT "business_hours_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."banners" 
    ADD CONSTRAINT "banners_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."categories" 
    ADD CONSTRAINT "categories_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."brands" 
    ADD CONSTRAINT "brands_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "public"."plans" ("id");
ALTER TABLE "public"."products" 
    ADD CONSTRAINT "products_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."profiles" 
    ADD CONSTRAINT "profiles_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."staff" 
    ADD CONSTRAINT "staff_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."experiences" 
    ADD CONSTRAINT "experiences_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."restaurant_tables" 
    ADD CONSTRAINT "restaurant_tables_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."promo_banners" 
    ADD CONSTRAINT "promo_banners_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."home_settings" 
    ADD CONSTRAINT "home_settings_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."allergens" 
    ADD CONSTRAINT "allergens_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."recipes" 
    ADD CONSTRAINT "recipes_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."ingredients" 
    ADD CONSTRAINT "ingredients_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."ingredient_categories" 
    ADD CONSTRAINT "ingredient_categories_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."modifiers" 
    ADD CONSTRAINT "modifiers_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."providers" 
    ADD CONSTRAINT "providers_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."brands" 
    ADD CONSTRAINT "brands_owner_id_fkey" 
    FOREIGN KEY ("owner_id") REFERENCES "auth"."users" ("id");
ALTER TABLE "public"."restaurant_settings" 
    ADD CONSTRAINT "restaurant_settings_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."locations" 
    ADD CONSTRAINT "locations_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."modifier_groups" 
    ADD CONSTRAINT "modifier_groups_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."payment_methods" 
    ADD CONSTRAINT "payment_methods_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."order_payments" 
    ADD CONSTRAINT "order_payments_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."leads" 
    ADD CONSTRAINT "leads_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."order_items" 
    ADD CONSTRAINT "order_items_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."customers" 
    ADD CONSTRAINT "customers_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."table_areas" 
    ADD CONSTRAINT "table_areas_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."analytics_events" 
    ADD CONSTRAINT "analytics_events_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."shifts" 
    ADD CONSTRAINT "shifts_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."profiles" 
    ADD CONSTRAINT "profiles_id_fkey" 
    FOREIGN KEY ("id") REFERENCES "auth"."users" ("id");
ALTER TABLE "public"."profiles" 
    ADD CONSTRAINT "profiles_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."categories" 
    ADD CONSTRAINT "categories_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."products" 
    ADD CONSTRAINT "products_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id");
ALTER TABLE "public"."location_categories" 
    ADD CONSTRAINT "location_categories_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id");
ALTER TABLE "public"."products" 
    ADD CONSTRAINT "products_recipe_id_fkey" 
    FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id");
ALTER TABLE "public"."location_inventory" 
    ADD CONSTRAINT "location_inventory_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."location_product_status" 
    ADD CONSTRAINT "location_product_status_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."location_product_prices" 
    ADD CONSTRAINT "location_product_prices_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."promo_banners" 
    ADD CONSTRAINT "promo_banners_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."order_items" 
    ADD CONSTRAINT "order_items_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."recipe_ingredients" 
    ADD CONSTRAINT "recipe_ingredients_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."products" 
    ADD CONSTRAINT "products_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id");
ALTER TABLE "public"."products" 
    ADD CONSTRAINT "products_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."product_ingredients" 
    ADD CONSTRAINT "product_ingredients_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."favorites" 
    ADD CONSTRAINT "favorites_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."product_ingredients" 
    ADD CONSTRAINT "product_ingredients_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."banners" 
    ADD CONSTRAINT "banners_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."favorites" 
    ADD CONSTRAINT "favorites_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."favorites" 
    ADD CONSTRAINT "favorites_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id");
ALTER TABLE "public"."modifiers" 
    ADD CONSTRAINT "modifiers_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."location_recipes" 
    ADD CONSTRAINT "location_recipes_recipe_id_fkey" 
    FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id");
ALTER TABLE "public"."recipes" 
    ADD CONSTRAINT "recipes_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."products" 
    ADD CONSTRAINT "products_recipe_id_fkey" 
    FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id");
ALTER TABLE "public"."recipe_ingredients" 
    ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" 
    FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id");
ALTER TABLE "public"."recipe_ingredients" 
    ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" 
    FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id");
ALTER TABLE "public"."recipe_ingredients" 
    ADD CONSTRAINT "recipe_ingredients_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."recipe_ingredients" 
    ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" 
    FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id");
ALTER TABLE "public"."ingredients" 
    ADD CONSTRAINT "ingredients_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "public"."ingredient_categories" ("id");
ALTER TABLE "public"."recipe_ingredients" 
    ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" 
    FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id");
ALTER TABLE "public"."ingredients" 
    ADD CONSTRAINT "ingredients_provider_id_fkey" 
    FOREIGN KEY ("provider_id") REFERENCES "public"."providers" ("id");
ALTER TABLE "public"."ingredients" 
    ADD CONSTRAINT "ingredients_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."modifier_options" 
    ADD CONSTRAINT "modifier_options_ingredient_id_fkey" 
    FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id");
ALTER TABLE "public"."location_inventory" 
    ADD CONSTRAINT "location_inventory_ingredient_id_fkey" 
    FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id");
ALTER TABLE "public"."ingredients" 
    ADD CONSTRAINT "ingredients_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "public"."ingredient_categories" ("id");
ALTER TABLE "public"."ingredient_categories" 
    ADD CONSTRAINT "ingredient_categories_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."providers" 
    ADD CONSTRAINT "providers_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."ingredients" 
    ADD CONSTRAINT "ingredients_provider_id_fkey" 
    FOREIGN KEY ("provider_id") REFERENCES "public"."providers" ("id");
ALTER TABLE "public"."allergens" 
    ADD CONSTRAINT "allergens_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."restaurant_settings" 
    ADD CONSTRAINT "restaurant_settings_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."restaurant_settings" 
    ADD CONSTRAINT "restaurant_settings_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."restaurant_tables" 
    ADD CONSTRAINT "restaurant_tables_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_table_id_fkey" 
    FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables" ("id");
ALTER TABLE "public"."restaurant_tables" 
    ADD CONSTRAINT "restaurant_tables_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."restaurant_tables" 
    ADD CONSTRAINT "restaurant_tables_area_id_fkey" 
    FOREIGN KEY ("area_id") REFERENCES "public"."table_areas" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_table_id_fkey" 
    FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id");
ALTER TABLE "public"."order_payments" 
    ADD CONSTRAINT "order_payments_order_id_fkey" 
    FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_waiter_id_fkey" 
    FOREIGN KEY ("waiter_id") REFERENCES "public"."staff" ("id");
ALTER TABLE "public"."order_items" 
    ADD CONSTRAINT "order_items_order_id_fkey" 
    FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id");
ALTER TABLE "public"."order_items" 
    ADD CONSTRAINT "order_items_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."order_items" 
    ADD CONSTRAINT "order_items_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."order_items" 
    ADD CONSTRAINT "order_items_order_id_fkey" 
    FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id");
ALTER TABLE "public"."staff" 
    ADD CONSTRAINT "staff_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_waiter_id_fkey" 
    FOREIGN KEY ("waiter_id") REFERENCES "public"."staff" ("id");
ALTER TABLE "public"."shifts" 
    ADD CONSTRAINT "shifts_staff_id_fkey" 
    FOREIGN KEY ("staff_id") REFERENCES "public"."staff" ("id");
ALTER TABLE "public"."staff" 
    ADD CONSTRAINT "staff_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."experience_bookings" 
    ADD CONSTRAINT "experience_bookings_experience_id_fkey" 
    FOREIGN KEY ("experience_id") REFERENCES "public"."experiences" ("id");
ALTER TABLE "public"."experiences" 
    ADD CONSTRAINT "experiences_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."experience_bookings" 
    ADD CONSTRAINT "experience_bookings_experience_id_fkey" 
    FOREIGN KEY ("experience_id") REFERENCES "public"."experiences" ("id");
ALTER TABLE "public"."business_hours" 
    ADD CONSTRAINT "business_hours_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."business_hours" 
    ADD CONSTRAINT "business_hours_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."promo_banners" 
    ADD CONSTRAINT "promo_banners_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."promo_banners" 
    ADD CONSTRAINT "promo_banners_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."home_settings" 
    ADD CONSTRAINT "home_settings_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."plan_features" 
    ADD CONSTRAINT "plan_features_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "public"."plans" ("id");
ALTER TABLE "public"."brands" 
    ADD CONSTRAINT "brands_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "public"."plans" ("id");
ALTER TABLE "public"."plan_features" 
    ADD CONSTRAINT "plan_features_plan_id_fkey" 
    FOREIGN KEY ("plan_id") REFERENCES "public"."plans" ("id");
ALTER TABLE "public"."location_product_status" 
    ADD CONSTRAINT "location_product_status_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_recipes" 
    ADD CONSTRAINT "location_recipes_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."locations" 
    ADD CONSTRAINT "locations_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."location_product_prices" 
    ADD CONSTRAINT "location_product_prices_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."staff" 
    ADD CONSTRAINT "staff_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_categories" 
    ADD CONSTRAINT "location_categories_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."restaurant_settings" 
    ADD CONSTRAINT "restaurant_settings_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_modifier_groups" 
    ADD CONSTRAINT "location_modifier_groups_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."business_hours" 
    ADD CONSTRAINT "business_hours_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."shifts" 
    ADD CONSTRAINT "shifts_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."leads" 
    ADD CONSTRAINT "leads_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_payment_methods" 
    ADD CONSTRAINT "location_payment_methods_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_inventory" 
    ADD CONSTRAINT "location_inventory_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."analytics_events" 
    ADD CONSTRAINT "analytics_events_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."table_areas" 
    ADD CONSTRAINT "table_areas_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."restaurant_tables" 
    ADD CONSTRAINT "restaurant_tables_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_modifier_groups" 
    ADD CONSTRAINT "location_modifier_groups_modifier_group_id_fkey" 
    FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_groups" ("id");
ALTER TABLE "public"."modifier_groups" 
    ADD CONSTRAINT "modifier_groups_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."modifier_options" 
    ADD CONSTRAINT "modifier_options_group_id_fkey" 
    FOREIGN KEY ("group_id") REFERENCES "public"."modifier_groups" ("id");
ALTER TABLE "public"."modifier_options" 
    ADD CONSTRAINT "modifier_options_nested_group_id_fkey" 
    FOREIGN KEY ("nested_group_id") REFERENCES "public"."modifier_groups" ("id");
ALTER TABLE "public"."modifier_options" 
    ADD CONSTRAINT "modifier_options_nested_group_id_fkey" 
    FOREIGN KEY ("nested_group_id") REFERENCES "public"."modifier_groups" ("id");
ALTER TABLE "public"."modifier_options" 
    ADD CONSTRAINT "modifier_options_ingredient_id_fkey" 
    FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id");
ALTER TABLE "public"."modifier_options" 
    ADD CONSTRAINT "modifier_options_group_id_fkey" 
    FOREIGN KEY ("group_id") REFERENCES "public"."modifier_groups" ("id");
ALTER TABLE "public"."payment_methods" 
    ADD CONSTRAINT "payment_methods_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."location_payment_methods" 
    ADD CONSTRAINT "location_payment_methods_payment_method_id_fkey" 
    FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods" ("id");
ALTER TABLE "public"."order_payments" 
    ADD CONSTRAINT "order_payments_payment_method_id_fkey" 
    FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods" ("id");
ALTER TABLE "public"."order_payments" 
    ADD CONSTRAINT "order_payments_payment_method_id_fkey" 
    FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods" ("id");
ALTER TABLE "public"."order_payments" 
    ADD CONSTRAINT "order_payments_order_id_fkey" 
    FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id");
ALTER TABLE "public"."order_payments" 
    ADD CONSTRAINT "order_payments_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."leads" 
    ADD CONSTRAINT "leads_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."leads" 
    ADD CONSTRAINT "leads_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."analytics_events" 
    ADD CONSTRAINT "analytics_events_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."analytics_events" 
    ADD CONSTRAINT "analytics_events_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."customers" 
    ADD CONSTRAINT "customers_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."orders" 
    ADD CONSTRAINT "orders_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id");
ALTER TABLE "public"."table_areas" 
    ADD CONSTRAINT "table_areas_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."table_areas" 
    ADD CONSTRAINT "table_areas_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."restaurant_tables" 
    ADD CONSTRAINT "restaurant_tables_area_id_fkey" 
    FOREIGN KEY ("area_id") REFERENCES "public"."table_areas" ("id");
ALTER TABLE "public"."location_product_prices" 
    ADD CONSTRAINT "location_product_prices_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."location_product_prices" 
    ADD CONSTRAINT "location_product_prices_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_product_status" 
    ADD CONSTRAINT "location_product_status_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."location_product_status" 
    ADD CONSTRAINT "location_product_status_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_inventory" 
    ADD CONSTRAINT "location_inventory_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");
ALTER TABLE "public"."location_inventory" 
    ADD CONSTRAINT "location_inventory_ingredient_id_fkey" 
    FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id");
ALTER TABLE "public"."location_inventory" 
    ADD CONSTRAINT "location_inventory_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_payment_methods" 
    ADD CONSTRAINT "location_payment_methods_payment_method_id_fkey" 
    FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods" ("id");
ALTER TABLE "public"."location_payment_methods" 
    ADD CONSTRAINT "location_payment_methods_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_categories" 
    ADD CONSTRAINT "location_categories_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_categories" 
    ADD CONSTRAINT "location_categories_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id");
ALTER TABLE "public"."location_recipes" 
    ADD CONSTRAINT "location_recipes_recipe_id_fkey" 
    FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id");
ALTER TABLE "public"."location_recipes" 
    ADD CONSTRAINT "location_recipes_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."location_modifier_groups" 
    ADD CONSTRAINT "location_modifier_groups_modifier_group_id_fkey" 
    FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_groups" ("id");
ALTER TABLE "public"."location_modifier_groups" 
    ADD CONSTRAINT "location_modifier_groups_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."shifts" 
    ADD CONSTRAINT "shifts_location_id_fkey" 
    FOREIGN KEY ("location_id") REFERENCES "public"."locations" ("id");
ALTER TABLE "public"."shifts" 
    ADD CONSTRAINT "shifts_brand_id_fkey" 
    FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");
ALTER TABLE "public"."shifts" 
    ADD CONSTRAINT "shifts_staff_id_fkey" 
    FOREIGN KEY ("staff_id") REFERENCES "public"."staff" ("id");