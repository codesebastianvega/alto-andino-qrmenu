-- 1. Fix Recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS target_price DECIMAL(12,2) DEFAULT 0;

-- 2. Fix Products table (SaaS Features)
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS modifier_groups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS config_options JSONB DEFAULT '{}'::jsonb;

-- 3. Security (RLS) for new tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- 3.1 Recipes Policies
CREATE POLICY "Public read recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Admin all recipes" ON recipes FOR ALL USING (auth.role() = 'authenticated');

-- 3.2 Recipe Ingredients Policies
CREATE POLICY "Public read recipe_ingredients" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "Admin all recipe_ingredients" ON recipe_ingredients FOR ALL USING (auth.role() = 'authenticated');

-- 3.3 Ingredient Categories Policies
CREATE POLICY "Public read ingredient_categories" ON ingredient_categories FOR SELECT USING (true);
CREATE POLICY "Admin all ingredient_categories" ON ingredient_categories FOR ALL USING (auth.role() = 'authenticated');

-- 3.4 Experiences Policies
CREATE POLICY "Public read experiences" ON experiences FOR SELECT USING (true);
CREATE POLICY "Admin all experiences" ON experiences FOR ALL USING (auth.role() = 'authenticated');

-- 4. Final verification of ingredients (migration phase 4)
-- Migration Phase 4 already enabled RLS for ingredients, but let's double check it has public read.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredients' AND policyname = 'Allow public read access on ingredients') THEN
        CREATE POLICY "Allow public read access on ingredients" ON ingredients FOR SELECT USING (true);
    END IF;
END $$;
