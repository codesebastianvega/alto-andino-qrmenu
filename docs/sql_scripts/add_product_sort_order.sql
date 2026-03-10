-- Add sort_order to products if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Optional: Initialize sort_order based on existing IDs or created_at for a deterministic initial state
-- UPDATE products SET sort_order = (
--   SELECT count(*) 
--   FROM products p2 
--   WHERE p2.category_id = products.category_id 
--   AND p2.created_at <= products.created_at
-- );
