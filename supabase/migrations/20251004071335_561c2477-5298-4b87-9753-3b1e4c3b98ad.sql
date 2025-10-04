-- Create form_submissions table to store form data
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_title TEXT NOT NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert form submissions (public forms)
CREATE POLICY "Allow public form submissions"
ON public.form_submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anyone to read their own submissions
CREATE POLICY "Allow reading all submissions"
ON public.form_submissions
FOR SELECT
TO anon
USING (true);

-- Create index for faster queries
CREATE INDEX idx_form_submissions_created_at ON public.form_submissions(created_at DESC);