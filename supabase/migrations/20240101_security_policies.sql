-- Enable Row Level Security (RLS) on all product-related tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 1. PRODUCTS POLICIES
-- Allow public (anon) access to view all products (or only active ones if preferred, but frontend filters anyway)
CREATE POLICY "Public products are viewable by everyone" 
ON products FOR SELECT 
TO anon, authenticated
USING ( true );

-- Allow authenticated users (e.g. admins) to do everything
CREATE POLICY "Authenticated users can modify products"
ON products FOR ALL
TO authenticated
USING ( true )
WITH CHECK ( true );

-- 2. MODIFIERS POLICIES
CREATE POLICY "Public modifiers are viewable by everyone" 
ON modifiers FOR SELECT 
TO anon, authenticated
USING ( true );

CREATE POLICY "Authenticated users can modify modifiers"
ON modifiers FOR ALL
TO authenticated
USING ( true )
WITH CHECK ( true );

-- 3. CATEGORIES POLICIES
CREATE POLICY "Public categories are viewable by everyone" 
ON categories FOR SELECT 
TO anon, authenticated
USING ( true );

CREATE POLICY "Authenticated users can modify categories"
ON categories FOR ALL
TO authenticated
USING ( true )
WITH CHECK ( true );
