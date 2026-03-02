-- Migrations for V2 Phase 1: Settings, Tables, and Allergens

-- 1. Create ALLERGENS table
CREATE TABLE IF NOT EXISTS allergens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default allergens to kickstart the system
INSERT INTO allergens (name, emoji) VALUES
  ('Lácteos', '🥛'),
  ('Vegetariano', '🌿'),
  ('Huevo', '🥚'),
  ('Gluten', '🌾'),
  ('Frutos secos', '🥜')
ON CONFLICT DO NOTHING;

-- 2. Create RESTAURANT_SETTINGS table
-- This replaces hardcoded branding and settings. Assuming a single-tenant for now, we'll enforce one row.
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name VARCHAR(100) NOT NULL DEFAULT 'Alto Andino',
  primary_color VARCHAR(20) NOT NULL DEFAULT '#7db87a',
  logo_url TEXT,
  whatsapp_number_orders VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row
INSERT INTO restaurant_settings (business_name, primary_color)
SELECT 'Alto Andino', '#7db87a'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings);

-- 3. Create RESTAURANT_TABLES table
-- For KDS and order placement identification
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_number VARCHAR(20) NOT NULL UNIQUE,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default tables
INSERT INTO restaurant_tables (table_number) VALUES
  ('Mesa 1'), ('Mesa 2'), ('Mesa 3'), ('Mesa 4'), ('Mesa 5'), ('Barra')
ON CONFLICT (table_number) DO NOTHING;

-- RLS Policies (Assuming basic authenticated access for admin, public read for menu)
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the client menu)
CREATE POLICY "Allow public read access on allergens" ON allergens FOR SELECT USING (true);
CREATE POLICY "Allow public read access on restaurant_settings" ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on restaurant_tables" ON restaurant_tables FOR SELECT USING (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "Allow authenticated full access on allergens" ON allergens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on restaurant_settings" ON restaurant_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on restaurant_tables" ON restaurant_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
