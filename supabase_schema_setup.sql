-- Create the 'reports' table
CREATE TABLE public.reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content_id uuid NOT NULL, -- ID of the content being reported (echo, product, etc.)
    type text NOT NULL, -- Type of content being reported (e.g., 'echo', 'product', 'profile')
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS for reports table
-- Allow authenticated users to insert reports.
DROP POLICY IF EXISTS "Allow authenticated users to insert reports" ON public.reports;
CREATE POLICY "Allow authenticated users to insert reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  (reporter_id = auth.uid())
);

-- Allow authenticated users to view their own reports.
DROP POLICY IF EXISTS "Allow authenticated users to view own reports" ON public.reports;
CREATE POLICY "Allow authenticated users to view own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  (reporter_id = auth.uid())
);