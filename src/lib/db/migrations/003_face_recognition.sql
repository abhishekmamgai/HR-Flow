-- Migration to add face recognition fields to employees table

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS face_embedding jsonb,
ADD COLUMN IF NOT EXISTS face_registered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS face_consent_given boolean DEFAULT false;
