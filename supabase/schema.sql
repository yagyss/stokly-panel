-- ============================================================
-- stokly · esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) Perfiles (opcional: nombre visible del usuario)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2) Productos
--    id TEXT: el cliente genera el id (UUID o "1","2"... de los datos demo)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 3) Ventas
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 4) Gastos
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 5) Row Level Security: cada usuario SOLO ve sus datos
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales   enable row level security;
alter table public.expenses enable row level security;

-- profiles
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- products
drop policy if exists "own products" on public.products;
create policy "own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sales
drop policy if exists "own sales" on public.sales;
create policy "own sales" on public.sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- expenses
drop policy if exists "own expenses" on public.expenses;
create policy "own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6) Trigger: crear perfil automáticamente al registrarse
-- ------------------------------------------------------------
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

-- ✅ Listo. Las 4 tablas quedan creadas con RLS activo.


-- ==========================================
-- workspaces + equipo (migrations/20260923000001 y 000002)
-- ==========================================

-- ============================================================
-- stokly · workspaces + miembros + invitaciones
-- ============================================================

-- 1) Cada fila de datos pertenece a un workspace -------------
alter table public.products add column if not exists workspace_id uuid;
alter table public.sales     add column if not exists workspace_id uuid;
alter table public.expenses  add column if not exists workspace_id uuid;

update public.products set workspace_id = user_id where workspace_id is null;
update public.sales     set workspace_id = user_id where workspace_id is null;
update public.expenses  set workspace_id = user_id where workspace_id is null;

alter table public.products alter column workspace_id set default auth.uid();
alter table public.sales     alter column workspace_id set default auth.uid();
alter table public.expenses  alter column workspace_id set default auth.uid();

alter table public.products alter column workspace_id set not null;
alter table public.sales     alter column workspace_id set not null;
alter table public.expenses  alter column workspace_id set not null;

-- 2) Miembros del panel --------------------------------------
create table if not exists public.workspace_members (
  workspace_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists wm_user_idx on public.workspace_members(user_id);

-- 3) Invitaciones pendientes ---------------------------------
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  email text not null,
  status text not null default 'pending',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists inv_email_idx on public.invitations (lower(email));
create index if not exists inv_ws_idx on public.invitations(workspace_id);

-- 4) Funciones auxiliares (security definer: evitan bucles de RLS)
create or replace function public.is_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.is_owner(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.my_email()
returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '');
$$;

create or replace function public.has_pending_invite(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invitations
    where workspace_id = ws
      and lower(email) = lower(public.my_email())
      and status = 'pending'
  );
$$;

-- 5) Cada usuario existente es dueño de su propio panel -----
insert into public.workspace_members (workspace_id, user_id, email, role)
select u.id, u.id, u.email, 'owner'
from auth.users u
on conflict do nothing;

-- 6) Al registrarse: perfil + panel propio ------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.workspace_members (workspace_id, user_id, email, role)
  values (new.id, new.id, new.email, 'owner')
  on conflict do nothing;

  return new;
end;
$$;

-- 7) Políticas de miembros ----------------------------------
alter table public.workspace_members enable row level security;
alter table public.invitations         enable row level security;

drop policy if exists "see members"        on public.workspace_members;
drop policy if exists "accept invite"      on public.workspace_members;
drop policy if exists "leave or remove"    on public.workspace_members;

create policy "see members" on public.workspace_members
  for select using (user_id = auth.uid() or public.is_member(workspace_id));

create policy "accept invite" on public.workspace_members
  for insert with check (
    user_id = auth.uid() and public.has_pending_invite(workspace_id)
  );

create policy "leave or remove" on public.workspace_members
  for delete using (
    user_id = auth.uid() or public.is_owner(workspace_id)
  );

-- 8) Políticas de invitaciones -------------------------------
drop policy if exists "invitee sees invite" on public.invitations;
drop policy if exists "members see invites" on public.invitations;
drop policy if exists "owner sends invites" on public.invitations;
drop policy if exists "invitee accepts"     on public.invitations;

create policy "invitee sees invite" on public.invitations
  for select using (lower(email) = lower(public.my_email()));

create policy "members see invites" on public.invitations
  for select using (public.is_member(workspace_id));

create policy "owner sends invites" on public.invitations
  for insert with check (public.is_owner(workspace_id));

create policy "owner manages invites" on public.invitations
  for update using (public.is_owner(workspace_id) or lower(email) = lower(public.my_email()))
  with check (true);

create policy "owner deletes invites" on public.invitations
  for delete using (public.is_owner(workspace_id));

-- 9) Datos: cualquier miembro del panel ve y edita ----------
drop policy if exists "own products" on public.products;
drop policy if exists "own sales"    on public.sales;
drop policy if exists "own expenses" on public.expenses;

create policy "panel products" on public.products
  for all
  using (user_id = auth.uid() and (workspace_id = auth.uid() or public.is_member(workspace_id)))
  with check (user_id = auth.uid() and (workspace_id = auth.uid() or public.is_member(workspace_id)));

create policy "panel sales" on public.sales
  for all
  using (user_id = auth.uid() and (workspace_id = auth.uid() or public.is_member(workspace_id)))
  with check (user_id = auth.uid() and (workspace_id = auth.uid() or public.is_member(workspace_id)));

create policy "panel expenses" on public.expenses
  for all
  using (user_id = auth.uid() and (workspace_id = auth.uid() or public.is_member(workspace_id)))
  with check (user_id = auth.uid() and (workspace_id = auth.uid() or public.is_member(workspace_id)));

-- ============================================================
-- Corrección: en un panel compartido, cualquier miembro ve y
-- edita TODAS las filas del panel (no solo las que creó).
-- El acceso se gobierna por workspace, no por user_id.
-- ============================================================

drop policy if exists "panel products" on public.products;
drop policy if exists "panel sales"    on public.sales;
drop policy if exists "panel expenses" on public.expenses;

create policy "panel products" on public.products
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));

create policy "panel sales" on public.sales
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));

create policy "panel expenses" on public.expenses
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));

-- ══ Migración 20260923000003: fotos por referencia (Storage) ══
alter table public.products add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images member write" on storage.objects;
create policy "product images member write" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_member(
        case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid end
      )
    )
  );

drop policy if exists "product images member update" on storage.objects;
create policy "product images member update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_member(
        case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid end
      )
    )
  )
  with check (
    bucket_id = 'product-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_member(
        case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid end
      )
    )
  );

drop policy if exists "product images member delete" on storage.objects;
create policy "product images member delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_member(
        case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid end
      )
    )
  );
-- Rango de fechas para gastos que duran varios días
-- (ej: PUBLICIDAD $100.000 — del 24 de septiembre al 10 de octubre)
alter table expenses add column if not exists date_end date;

-- Código de barras por variante de producto (para escanear la etiqueta de la prenda)
alter table products add column if not exists barcode text;

