-- Add country fields to the products table
ALTER TABLE products 
ADD COLUMN country TEXT,
ADD COLUMN target_countries TEXT;

-- Optional: Add a comment for clarity
COMMENT ON COLUMN products.country IS 'The primary country of origin for the product';
COMMENT ON COLUMN products.target_countries IS 'Additional countries where the product is available or targeted';