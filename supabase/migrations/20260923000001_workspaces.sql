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
