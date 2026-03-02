-- 1. FIX THE BUG: Add UPDATE policy for ingredients so admins can save
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin all ingredients" ON ingredients;
CREATE POLICY "Admin all ingredients" ON ingredients FOR ALL USING (true);

-- 2. Add columns for Profit Margin on extras
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS portion_size DECIMAL(12,3) DEFAULT 50; -- Default 50 gramos/ml/etc

-- 3. Create Providers table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for providers
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Admin all providers" ON providers FOR ALL USING (true);

-- 4. Link ingredients to providers
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id);
