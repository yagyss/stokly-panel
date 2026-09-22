-- ============================================================
-- stokly · migración inicial
-- ============================================================
create extension if not exists "pgcrypto";

-- Perfiles -------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Productos ------------------------------------------------
create table if not exists public.products (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text not null,
  brand text default '',
  color text default '',
  size text default '',
  category text default 'Otro',
  stock integer not null default 0,
  min_stock integer not null default 5,
  price numeric not null default 0,
  cost numeric not null default 0,
  sold integer not null default 0,
  emoji text default '📦',
  created_at timestamptz default now(),
  unique (user_id, sku)
);
create index if not exists products_user_idx on public.products(user_id);

-- Ventas ---------------------------------------------------
create table if not exists public.sales (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  qty integer not null default 1,
  total numeric not null default 0,
  date date not null default current_date,
  method text default 'Efectivo',
  created_at timestamptz default now()
);
create index if not exists sales_user_idx on public.sales(user_id);

-- Gastos ---------------------------------------------------
create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  concept text not null,
  amount numeric not null default 0,
  date date not null default current_date,
  category text default 'Operacional',
  emoji text default '💡',
  created_at timestamptz default now()
);
create index if not exists expenses_user_idx on public.expenses(user_id);

-- Row Level Security --------------------------------------
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;
alter table public.sales     enable row level security;
alter table public.expenses  enable row level security;

drop policy if exists "own profile"   on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own products"  on public.products;
create policy "own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sales"     on public.sales;
create policy "own sales" on public.sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own expenses"  on public.expenses;
create policy "own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Perfil automático al registrarse ------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
