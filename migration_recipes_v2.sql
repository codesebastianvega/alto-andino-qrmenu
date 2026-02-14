-- 1. Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    total_cost DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- This should be an ingredient (is_addon=true)
    quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add recipe_id to products to allow linking menu items to technical recipes
ALTER TABLE products ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

-- 4. Trigger to update updated_at on recipes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_recipes' AND tgrelid = 'recipes'::regclass) THEN
        CREATE TRIGGER set_updated_at_recipes
        BEFORE UPDATE ON recipes
        FOR EACH ROW
        EXECUTE FUNCTION moddatetime (updated_at);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
