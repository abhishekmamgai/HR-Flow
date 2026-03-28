-- Run in Supabase SQL Editor if not already applied

alter table public.employees
  add column if not exists phone varchar(15),
  add column if not exists employment_type text default 'full_time' check (employment_type in ('full_time', 'part_time', 'contract', 'intern')),
  add column if not exists date_of_joining date,
  add column if not exists profile_photo_url text;
