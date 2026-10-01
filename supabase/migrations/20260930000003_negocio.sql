-- ============================================================
-- stokly — Datos del NEGOCIO por panel (20260930000003)
--   · nombre del negocio (o el nombre personal) y su LOGO
--   · cada panel (negocio) guarda lo suyo; los miembros lo ven
--   · el catálogo público solo expone nombre y logo
-- ============================================================

create table if not exists public.workspaces (
  id uuid primary key,
  name text not null default '',
  logo_url text not null default '',
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

drop policy if exists "members see panel" on public.workspaces;
create policy "members see panel" on public.workspaces
  for select using (is_member(id));

drop policy if exists "members update panel" on public.workspaces;
create policy "members update panel" on public.workspaces
  for update using (is_member(id)) with check (is_member(id));

drop policy if exists "members create panel" on public.workspaces;
create policy "members create panel" on public.workspaces
  for insert with check (is_member(id) or id = auth.uid());

drop policy if exists "owner deletes panel" on public.workspaces;
create policy "owner deletes panel" on public.workspaces
  for delete using (is_owner(id));

-- Paneles que ya existen: cada uno recibe su fila
insert into public.workspaces (id)
select distinct wm.workspace_id from public.workspace_members wm
on conflict (id) do nothing;

-- Datos públicos del negocio (para el catálogo): solo nombre y logo.
-- Igual que el catálogo: nunca datos internos, siempre el panel pedido.
create or replace function public.negocio_publico(ws uuid)
returns table (name text, logo_url text)
language sql
stable
security definer
set search_path = public
as $$
  select w.name, w.logo_url
  from public.workspaces w
  where w.id = ws
$$;

revoke execute on function public.negocio_publico(uuid) from public;
grant  execute on function public.negocio_publico(uuid) to anon, authenticated;
