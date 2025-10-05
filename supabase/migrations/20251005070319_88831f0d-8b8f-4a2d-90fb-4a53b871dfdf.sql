-- Add form_id to form_submissions table
ALTER TABLE public.form_submissions ADD COLUMN form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE;

-- Add user_id to forms table
ALTER TABLE public.forms ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add accepting_responses column to forms
ALTER TABLE public.forms ADD COLUMN accepting_responses boolean DEFAULT true;

-- Update RLS policies for forms table
DROP POLICY IF EXISTS "Allow public form creation" ON public.forms;
DROP POLICY IF EXISTS "Allow public read access to forms" ON public.forms;

-- Allow authenticated users to create their own forms
CREATE POLICY "Users can create their own forms" ON public.forms
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anyone to view forms that are accepting responses
CREATE POLICY "Anyone can view forms" ON public.forms
FOR SELECT USING (true);

-- Allow users to update their own forms
CREATE POLICY "Users can update their own forms" ON public.forms
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own forms
CREATE POLICY "Users can delete their own forms" ON public.forms
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Update RLS policies for form_submissions table
DROP POLICY IF EXISTS "Allow public form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Allow reading all submissions" ON public.form_submissions;

-- Allow anyone to submit to active forms
CREATE POLICY "Anyone can submit to active forms" ON public.form_submissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = form_submissions.form_id
    AND forms.accepting_responses = true
  )
);

-- Allow form owners to view their form submissions
CREATE POLICY "Form owners can view submissions" ON public.form_submissions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = form_submissions.form_id
    AND forms.user_id = auth.uid()
  )
);

-- Allow form owners to delete submissions
CREATE POLICY "Form owners can delete submissions" ON public.form_submissions
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = form_submissions.form_id
    AND forms.user_id = auth.uid()
  )
);