-- ============================================================
-- stokly — Catálogo público SEGURO (20260930000002)
--
-- Problema: la vista `catalogo` era "UNRESTRICTED": se ejecutaba con
-- los permisos de su dueño (postgres) y NO aplicaba RLS, así que
-- cualquiera con la clave pública podía listar productos de TODOS
-- los paneles (no solo del que tenía el link).
--
-- Solución: se elimina la vista y se expone una función que solo
-- devuelve el panel que se le pide (ws) y únicamente columnas
-- seguras: nunca costo, vendidos ni datos del usuario.
-- ============================================================

drop view if exists public.catalogo;

create or replace function public.catalogo_publico(ws uuid)
returns table (
  id text,
  workspace_id uuid,
  name text,
  sku text,
  brand text,
  color text,
  size text,
  category text,
  subcategory text,
  stock integer,
  price numeric,
  emoji text,
  image_url text,
  barcode text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.workspace_id, p.name, p.sku, p.brand, p.color, p.size,
         p.category, p.subcategory, p.stock, p.price, p.emoji, p.image_url,
         p.barcode, p.created_at
  from public.products p
  where p.workspace_id = ws
$$;

-- Solo la app (anon y usuarios con sesión) pueden llamarla.
revoke execute on function public.catalogo_publico(uuid) from public;
grant  execute on function public.catalogo_publico(uuid) to anon, authenticated;
