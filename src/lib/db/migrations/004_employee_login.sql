-- Step 1: Database Changes for Employee Login System

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS temp_password TEXT DEFAULT 'AskTech@123',
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create employee_credentials table
-- Stores login info for admin to see
CREATE TABLE IF NOT EXISTS public.employee_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  employee_code TEXT NOT NULL,
  temp_password TEXT NOT NULL DEFAULT 'AskTech@123',
  is_password_changed BOOLEAN DEFAULT false,
  password_reset_at TIMESTAMPTZ,
  reset_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_credentials ENABLE ROW LEVEL SECURITY;

-- Admin Policy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employee_credentials' 
        AND policyname = 'credentials_admin_only'
    ) THEN
        CREATE POLICY "credentials_admin_only" 
        ON public.employee_credentials
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.user_id = auth.uid()
            AND cu.company_id = employee_credentials.company_id
            AND cu.role IN ('admin', 'hr')
          )
        );
    END IF;
END $$;

-- Update existing employees with codes (as per user request)
UPDATE public.employees SET employee_code = 'ASK-2026-001'
WHERE first_name = 'Rahul' AND employee_code IS NULL;
UPDATE public.employees SET employee_code = 'ASK-2026-002'
WHERE first_name = 'Priya' AND employee_code IS NULL;
UPDATE public.employees SET employee_code = 'ASK-2026-003'
WHERE first_name = 'Amit' AND employee_code IS NULL;
UPDATE public.employees SET employee_code = 'ASK-2026-004'
WHERE first_name = 'Abhishek' AND employee_code IS NULL;
