-- Leave types (company-scoped, defaults)
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name varchar(50) not null,
  code varchar(10) not null,
  total_days int not null default 12,
  paid boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create index if not exists idx_leave_types_company on public.leave_types(company_id);

-- Leave balances per employee per type per year
create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year int not null,
  total int not null default 0,
  used int not null default 0,
  pending int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, employee_id, leave_type_id, year)
);

create index if not exists idx_leave_balances_emp on public.leave_balances(company_id, employee_id);

-- Leave applications
create table if not exists public.leaves (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  rejection_reason text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_leaves_company_status on public.leaves(company_id, status);
create index if not exists idx_leaves_employee on public.leaves(company_id, employee_id);

alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leaves enable row level security;

drop policy if exists "leave_types_company" on public.leave_types;
create policy "leave_types_company" on public.leave_types for all using (
  exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leave_types.company_id)
) with check (
  exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leave_types.company_id)
);

drop policy if exists "leave_balances_company" on public.leave_balances;
create policy "leave_balances_company" on public.leave_balances for all using (
  exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leave_balances.company_id)
) with check (
  exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leave_balances.company_id)
);

drop policy if exists "leaves_company" on public.leaves;
create policy "leaves_company" on public.leaves for all using (
  exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leaves.company_id)
) with check (
  exists (select 1 from public.company_users cu where cu.user_id = auth.uid() and cu.company_id = leaves.company_id)
);
