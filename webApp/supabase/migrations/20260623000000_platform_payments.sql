CREATE TABLE IF NOT EXISTS platform_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL UNIQUE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default services if they don't exist
INSERT INTO platform_payments (service_name, due_date) VALUES 
('Supabase', NOW() + INTERVAL '30 days'),
('Google Cloud', NOW() + INTERVAL '30 days'),
('Agora', NOW() + INTERVAL '30 days'),
('Redis', NOW() + INTERVAL '30 days')
ON CONFLICT (service_name) DO NOTHING;

-- Set up RLS
ALTER TABLE platform_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform payments"
    ON platform_payments FOR SELECT
    USING (true);

CREATE POLICY "Only specific admin can update platform payments"
    ON platform_payments FOR UPDATE
    USING (auth.jwt() ->> 'email' = 'nephclick@gmail.com');
