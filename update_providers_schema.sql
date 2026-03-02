-- Add advanced provider CRM fields to the providers table
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS delivery_days TEXT,
ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Notify postgrest to reload the schema cache so the JS client can see the new columns
NOTIFY pgrst, 'reload schema';
