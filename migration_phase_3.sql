-- 1. Add is_addon to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT false;

-- 2. Create experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    banner_title TEXT,
    banner_description TEXT,
    banner_image_url TEXT,
    accent_color TEXT DEFAULT '#2f4131',
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add handle_updated_at function if it doesn't exist (usually present in Supabase)
-- CREATE OR REPLACE FUNCTION public.handle_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- 4. Add handle_updated_at trigger for experiences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'experiences'::regclass) THEN
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON experiences
        FOR EACH ROW
        EXECUTE FUNCTION moddatetime (updated_at);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
