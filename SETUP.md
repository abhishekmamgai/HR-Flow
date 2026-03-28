# HRFlow Setup

## 1. Environment

Add to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API → service_role>
```

(You already have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.)

## 2. Storage bucket (for profile photos)

1. Supabase Dashboard → Storage
2. Create bucket: `profiles`
3. Set it to **Public** if you want public profile photo URLs
4. Add RLS policy if needed (or use default)

## 3. Optional: extra employee columns

Run in Supabase SQL Editor if you want phone, employment_type, date_of_joining, profile_photo_url:

```sql
-- From src/lib/db/migrations/001_employee_fields.sql
alter table public.employees
  add column if not exists phone varchar(15),
  add column if not exists employment_type text default 'full_time',
  add column if not exists date_of_joining date,
  add column if not exists profile_photo_url text;
```

## 4. Seed database

1. Open http://localhost:3000
2. Click **"1. Seed database"**
3. Use the shown credentials to login: `admin@asktech.in` / `AskTech2026!`

## 5. Run app

```bash
npm run dev
```

Open http://localhost:3000
