-- ============================================================
-- CRM: fichas de cliente por panel + venta ligada al cliente
-- Idempotente: se puede aplicar varias veces sin romper nada.
-- ============================================================

create table if not exists public.customers (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null,
  name text not null,
  city text default '',
  phone text default '',
  email text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists customers_ws_idx on public.customers(workspace_id);

-- La venta guarda a quién se le vendió (anulable: las ventas viejas quedan sin cliente)
alter table public.sales
  add column if not exists customer_id text;

create index if not exists sales_customer_idx on public.sales(customer_id);

-- Si se borra un cliente, sus ventas siguen pero quedan sin cliente
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sales_customer_fk'
  ) then
    alter table public.sales
      add constraint sales_customer_fk
      foreign key (customer_id)
      references public.customers(id)
      on delete set null;
  end if;
end $$;

-- ------------------------------------------------------------
-- RLS: cada panel solo ve/edita SUS clientes (mismo patrón que
-- las categorías: workspace propio o miembro del panel)
-- ------------------------------------------------------------
alter table public.customers enable row level security;

drop policy if exists "panel customers" on public.customers;
create policy "panel customers" on public.customers
  for all
  using (workspace_id = auth.uid() or public.is_member(workspace_id))
  with check (workspace_id = auth.uid() or public.is_member(workspace_id));
