-- Fix home_settings columns, unique constraint and RLS policies

-- 1. Ensure columns exist
ALTER TABLE public.home_settings ADD COLUMN IF NOT EXISTS menu_hero_title text;
ALTER TABLE public.home_settings ADD COLUMN IF NOT EXISTS menu_hero_subtitle text;

-- 2. Ensure UNIQUE constraint on brand_id for upsert compatibility
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'home_settings_brand_id_key' 
        AND conrelid = 'public.home_settings'::regclass
    ) THEN
        ALTER TABLE public.home_settings ADD CONSTRAINT home_settings_brand_id_key UNIQUE (brand_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Fix RLS policies on home_settings
ALTER TABLE public.home_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secure_admin_manage_home_settings" ON public.home_settings;
DROP POLICY IF EXISTS "secure_public_read_home_settings" ON public.home_settings;

-- Public read access for web menu & landing page
CREATE POLICY "secure_public_read_home_settings" ON public.home_settings
FOR SELECT TO anon, authenticated
USING (true);

-- Admin manage access for brand owners & managers
CREATE POLICY "secure_admin_manage_home_settings" ON public.home_settings
FOR ALL TO authenticated
USING (
    public.is_brand_manager(brand_id)
    OR EXISTS (SELECT 1 FROM public.brands WHERE id = home_settings.brand_id AND owner_id = auth.uid())
)
WITH CHECK (
    public.is_brand_manager(brand_id)
    OR EXISTS (SELECT 1 FROM public.brands WHERE id = home_settings.brand_id AND owner_id = auth.uid())
);
