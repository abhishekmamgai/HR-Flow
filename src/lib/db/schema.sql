create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.company_users (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'company_admin', 'hr_manager', 'employee')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index if not exists idx_company_users_user_id on public.company_users(user_id);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_departments_company_id on public.departments(company_id);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  email varchar(255) not null,
  designation varchar(100),
  department_id uuid references public.departments(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'on_leave', 'terminated', 'notice_period')),
  face_embedding jsonb,
  face_consent_given boolean default false,
  employee_code varchar(20) unique,
  first_login boolean not null default true,
  base_salary numeric(12,2) not null default 0,
  hra numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  tds_annual_projected numeric(12,2) not null default 0,
  professional_tax numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create index if not exists idx_employees_company_id on public.employees(company_id);
create index if not exists idx_employees_company_status on public.employees(company_id, status);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  status text not null check (status in ('PRESENT', 'HALF_DAY', 'LATE', 'EARLY_OUT', 'ABSENT', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND')),
  check_in timestamptz,
  check_out timestamptz,
  total_hours numeric(5,2),
  is_face_verified boolean default false,
  face_match_score numeric(5,4),
  created_at timestamptz not null default now(),
  unique (company_id, employee_id, date)
);

create index if not exists idx_attendance_company_date on public.attendance(company_id, date);
create index if not exists idx_attendance_company_employee on public.attendance(company_id, employee_id);

create table if not exists public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null check (year >= 2020),
  gross_earnings numeric(12,2) not null default 0,
  pf_deduction numeric(12,2) not null default 0,
  esi_deduction numeric(12,2) not null default 0,
  tds_deduction numeric(12,2) not null default 0,
  lop_deduction numeric(12,2) not null default 0,
  professional_tax numeric(12,2) not null default 0,
  other_deductions numeric(12,2) not null default 0,
  total_deductions numeric(12,2) not null default 0,
  net_salary numeric(12,2) not null default 0,
  days_present int not null default 0,
  total_working_days int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, employee_id, month, year)
);

create index if not exists idx_payroll_entries_company_period on public.payroll_entries(company_id, year desc, month desc);

alter table public.company_users enable row level security;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.payroll_entries enable row level security;

drop policy if exists "company_users_select_own_company" on public.company_users;
create policy "company_users_select_own_company" on public.company_users
for select using (user_id = auth.uid());

drop policy if exists "departments_company_isolation" on public.departments;
create policy "departments_company_isolation" on public.departments
for all using (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = departments.company_id
  )
)
with check (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = departments.company_id
  )
);

drop policy if exists "employees_company_isolation" on public.employees;
create policy "employees_company_isolation" on public.employees
for all using (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = employees.company_id
  )
)
with check (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = employees.company_id
  )
);

drop policy if exists "attendance_company_isolation" on public.attendance;
create policy "attendance_company_isolation" on public.attendance
for all using (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = attendance.company_id
  )
)
with check (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = attendance.company_id
  )
);

drop policy if exists "payroll_company_isolation" on public.payroll_entries;
create policy "payroll_company_isolation" on public.payroll_entries
for all using (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = payroll_entries.company_id
  )
)
with check (
  exists (
    select 1 from public.company_users cu
    where cu.user_id = auth.uid() and cu.company_id = payroll_entries.company_id
  )
);

-- Clean table definitions for Leaves and Payroll
drop table if exists public.leaves cascade;
drop table if exists public.leave_balances cascade;
drop table if exists public.leave_types cascade;

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code varchar(10) not null,
  total_days int not null default 0,
  paid boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year int not null,
  total int not null,
  used int not null default 0,
  pending int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, employee_id, leave_type_id, year)
);

create table public.leaves (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  approved_by uuid references auth.users(id),
  rejection_reason text,
  created_at timestamptz not null default now()
);

alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leaves enable row level security;

create policy "leave_types_isolation" on public.leave_types for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leave_types.company_id));
create policy "leave_balances_isolation" on public.leave_balances for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leave_balances.company_id));
create policy "leaves_isolation" on public.leaves for all using (exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leaves.company_id));

-- Trigger
create or replace function public.update_leave_balance_on_approval()
returns trigger as $$
begin
  if (new.status = 'approved' and old.status = 'pending') then
    update public.leave_balances
    set used = used + (new.to_date - new.from_date + 1),
        pending = pending - (new.to_date - new.from_date + 1)
    where employee_id = new.employee_id
      and leave_type_id = new.leave_type_id
      and year = extract(year from new.from_date);
  elsif (new.status = 'pending' and (old.status is null or old.status = 'pending')) then
     update public.leave_balances
     set pending = pending + (new.to_date - new.from_date + 1)
     where employee_id = new.employee_id
       and leave_type_id = new.leave_type_id
       and year = extract(year from new.from_date);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_leave_balance
after insert or update on public.leaves
for each row execute function public.update_leave_balance_on_approval();

-- Ensure named constraints exist for PostgREST hints
do $$ 
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_leaves_employee') then
    alter table public.leaves add constraint fk_leaves_employee foreign key (employee_id) references public.employees(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_leaves_type') then
    alter table public.leaves add constraint fk_leaves_type foreign key (leave_type_id) references public.leave_types(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_attendance_employee') then
    alter table public.attendance add constraint fk_attendance_employee foreign key (employee_id) references public.employees(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_payroll_employee') then
    alter table public.payroll_entries add constraint fk_payroll_employee foreign key (employee_id) references public.employees(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_balances_employee') then
    alter table public.leave_balances add constraint fk_balances_employee foreign key (employee_id) references public.employees(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_balances_type') then
    alter table public.leave_balances add constraint fk_balances_type foreign key (leave_type_id) references public.leave_types(id) on delete cascade;
  end if;
end $$;
