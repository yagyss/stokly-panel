-- ============================================================
-- stokly — Categorías y subcategorías por panel (workspace)
-- Cada negocio tiene las suyas; RLS por workspace_id.
-- Los productos guardan la referencia por ID (category_id /
-- subcategory_id) y además el nombre en texto (category /
-- subcategory) para no romper filtros, exportaciones y
-- productos existentes.
-- ============================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_ws_name_uq
  on public.categories (workspace_id, name);
create index if not exists categories_ws_idx
  on public.categories (workspace_id);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  workspace_id uuid not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists subcategories_cat_name_uq
  on public.subcategories (category_id, name);
create index if not exists subcategories_ws_idx
  on public.subcategories (workspace_id);
create index if not exists subcategories_cat_idx
  on public.subcategories (category_id);

-- Referencias desde los productos (compatibles con los actuales:
-- todas las columnas son nuevas y anulables, no se pierde nada)
alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.products
  add column if not exists subcategory_id uuid references public.subcategories(id) on delete set null;
alter table public.products
  add column if not exists subcategory text default '';

-- ------------------------------------------------------------
-- RLS: cada negocio solo ve/edita las suyas
-- ------------------------------------------------------------
alter table public.categories    enable row level security;
alter table public.subcategories enable row level security;

drop policy if exists "panel categories" on public.categories;
create policy "panel categories" on public.categories
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));

drop policy if exists "panel subcategories" on public.subcategories;
create policy "panel subcategories" on public.subcategories
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));

-- ------------------------------------------------------------
-- Vista pública del catálogo: expone también la subcategoría
-- (nunca costos ni datos internos). Se recrea porque PostgreSQL
-- no permite insertar columnas en medio con CREATE OR REPLACE.
-- ------------------------------------------------------------
drop view if exists public.catalogo;

create view public.catalogo as
  select id, workspace_id, name, sku, brand, color, size, category, subcategory,
         stock, price, emoji, image_url, barcode, created_at
  from public.products;

grant select on public.catalogo to anon, authenticated;
