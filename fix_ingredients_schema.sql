-- Run this query in your Supabase SQL Editor to add the missing columns to the ingredients table

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS usage_unit TEXT DEFAULT 'unidad';
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS purchase_unit TEXT DEFAULT 'Unidad';
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS purchase_quantity DECIMAL(12,3) DEFAULT 1;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2) DEFAULT 0;

-- Optional: If you want to backfill existing ingredients, you can set some default values
-- UPDATE ingredients SET usage_unit = 'u' WHERE usage_unit IS NULL;
