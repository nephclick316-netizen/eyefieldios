-- SQL script to allow users to delete their own Echoes, Pulses, and Products (Cascadea)

-- Enable RLS (if not already enabled)
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 1. DELETE Policy for Echoes
-- Allows a user to delete a row in the "echoes" table if their auth.uid() matches the user_id.
CREATE POLICY "Users can delete their own echoes"
ON echoes
FOR DELETE
USING (auth.uid() = user_id);

-- 2. DELETE Policy for Pulses
-- Allows a user to delete a row in the "pulses" table if their auth.uid() matches the user_id.
CREATE POLICY "Users can delete their own pulses"
ON pulses
FOR DELETE
USING (auth.uid() = user_id);

-- 3. DELETE Policy for Products (Cascadea)
-- Allows a user to delete a row in the "products" table if their auth.uid() matches the seller_id.
CREATE POLICY "Users can delete their own products"
ON products
FOR DELETE
USING (auth.uid() = seller_id);

-- NOTE: If your database uses a different user column name (e.g., 'owner_id'), adjust the USING clause accordingly.
