-- Fotos por referencia de inventario (Supabase Storage, plan gratis)
-- Migración: 20260923000003_product_images.sql

-- 1) Columna para guardar la URL de la foto en cada variante de la referencia
alter table public.products add column if not exists image_url text;

-- 2) Bucket público de fotos de producto
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 3) Lectura pública de las fotos (las URLs solo las conoce quien sube)
drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

-- 4) Escritura: solo miembros del panel (primera carpeta = workspace_id)
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

-- 5) Actualizar fotos (mismas reglas)
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

-- 6) Borrar fotos de referencias eliminadas (mismas reglas)
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
