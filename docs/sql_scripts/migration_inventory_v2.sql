-- Migration Phase 4: Independent Ingredients & Inventory V2

-- 1. Create the ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    category TEXT, -- e.g., 'insumo', 'base', 'proteina'
    
    -- Purchasing Info
    purchase_price DECIMAL(12,2) DEFAULT 0,
    purchase_unit TEXT, -- e.g., 'Litro', 'Kg', 'Caja', 'Unidad'
    purchase_quantity DECIMAL(12,2) DEFAULT 1, -- e.g., 1000 for ml
    
    -- Usage Info
    usage_unit TEXT, -- e.g., 'ml', 'gr', 'unidad'
    unit_cost DECIMAL(12,4) DEFAULT 0, -- Calculated: purchase_price / (purchase_quantity)
    
    -- Inventory
    stock_current DECIMAL(12,2) DEFAULT 0,
    stock_min DECIMAL(12,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on ingredients" ON ingredients FOR SELECT USING (true);
CREATE POLICY "Allow all for authenticated users on ingredients" ON ingredients FOR ALL USING (auth.role() = 'authenticated');

-- 2. Add moddatetime trigger
CREATE TRIGGER handle_updated_at_ingredients
BEFORE UPDATE ON ingredients
FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 3. Migrate existing addon products to ingredients
INSERT INTO ingredients (id, name, description, purchase_price, unit_cost, is_active, created_at)
SELECT id, name, description, price, cost, is_active, created_at
FROM products
WHERE is_addon = true;

-- 4. Update recipe_ingredients relationship
-- First, add the new column
ALTER TABLE recipe_ingredients ADD COLUMN ingredient_id UUID REFERENCES ingredients(id);

-- Link existing data (since IDs were preserved during migration above)
UPDATE recipe_ingredients SET ingredient_id = product_id;

-- Make it mandatory and drop old column (after verifying)
-- ALTER TABLE recipe_ingredients ALTER COLUMN ingredient_id SET NOT NULL;
-- ALTER TABLE recipe_ingredients DROP COLUMN product_id;

-- 5. Cleanup products table
-- We keep the columns for now but we will stop using them for ingredients
-- DELETE FROM products WHERE is_addon = true;
