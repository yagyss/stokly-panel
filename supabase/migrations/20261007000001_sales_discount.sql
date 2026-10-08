-- 🏷️ Descuento por venta (rebajas que se hacen al registrar la venta)
--
-- MIENTRAS NO EXISTIÓ esta columna, el descuento viajaba codificado dentro de
-- `method` ("Efectivo·dto:10000") para poder guardarlo en la nube sin tocar el
-- esquema. Hoy ya está listo el soporte en el código:
--   · src/lib/data.js  ->  saleFromRow/saleToRow (codifica y decodifica)
--
-- ⚠️ ESTA MIGRACIÓN ES EL ÚLTIMO PASO y debe hacerse en este orden:
--   1. Aplicar este archivo (SQL Editor de Supabase).
--   2. Avisar para actualizar src/lib/data.js y dejar de codificar en `method`
--      (escribir la columna `discount` y leer method limpio).
--      Hasta ese aviso NO se rompe nada: la app sigue leyendo lo codificado.
--
-- Se puede correr más de una vez (es idempotente).

alter table public.sales add column if not exists discount numeric not null default 0;

-- Mueve el valor codificado a la columna y deja `method` limpio
with d as (
  select
    id,
    coalesce(nullif((regexp_match(method, '^(.*?)·dto:(\d+)$'))[1], ''), 'Efectivo') as m_base,
    ((regexp_match(method, '^(.*?)·dto:(\d+)$'))[2]::numeric)                        as m_dto
  from public.sales
  where method ~ '·dto:\d+$'
)
update public.sales s
   set discount = d.m_dto,
       method   = d.m_base
  from d
 where s.id = d.id;
