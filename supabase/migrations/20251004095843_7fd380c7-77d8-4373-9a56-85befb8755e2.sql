-- Create forms table to store form schemas
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read forms (public sharing)
CREATE POLICY "Allow public read access to forms"
ON public.forms
FOR SELECT
USING (true);

-- Allow anyone to create forms (anonymous form creation)
CREATE POLICY "Allow public form creation"
ON public.forms
FOR INSERT
WITH CHECK (true);