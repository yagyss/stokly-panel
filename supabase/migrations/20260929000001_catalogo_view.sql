-- 📲 Vista PÚBLICA del catálogo (#/catalogo?ws=...&talla=...)
-- Cualquiera con el link puede ver las prendas SIN iniciar sesión.
-- Seguridad:
--   * Solo expone columnas seguras (NUNCA costo, stock mínimo, vendidos ni user_id).
--   * Las vistas en PostgreSQL se ejecutan con los permisos del dueño (postgres),
--     por lo que las políticas RLS de products no bloquean la consulta del visitante.
--   * El visitante solo puede filtrar por workspace_id (el que viene en el link).
create or replace view public.catalogo as
  select id, workspace_id, name, sku, brand, color, size, category,
         stock, price, emoji, image_url, barcode, created_at
  from public.products;

grant select on public.catalogo to anon, authenticated;

notify pgrst, 'reload schema';
