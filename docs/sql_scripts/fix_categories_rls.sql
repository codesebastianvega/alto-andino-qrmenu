-- Fix RLS policies for categories table
-- This allows authenticated users to update categories

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Authenticated users can modify categories" ON categories;

-- Create new policies
CREATE POLICY "Public read categories" 
ON categories FOR SELECT 
USING (true);

CREATE POLICY "Admin insert categories" 
ON categories FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update categories" 
ON categories FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete categories" 
ON categories FOR DELETE 
USING (auth.role() = 'authenticated');
