-- ============================================================
--  stokly · Ciclo de vida del pedido, contraentrega y atribución
--  Fecha: 2026-10-08 · Autorización del dueño del proyecto
--
--  Características:
--   · SÓLO AGREGA columnas (no borra ni modifica ninguna existente)
--   · Las 21 ventas históricas quedan:
--       modality = 'pagada'      (se contaban como ingreso y siguen igual)
--       status   = 'entregado'   (confirmadas: ningún total cambia)
--       attribution = null       → en la app se muestra "Sin atribuir"
--   · Como no se crean tablas nuevas, las políticas RLS y el login
--     NO se tocan.
--
--  Reversa (si hiciera falta):
--   alter table public.sales drop column status, drop column modality, ...;
-- ============================================================

-- 1) Modalidad de pago + estado del pedido
alter table public.sales
  add column if not exists modality     text     not null default 'pagada',
  add column if not exists status       text     not null default 'entregado',
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid;

-- 2) Devoluciones (admiten cantidad parcial)
alter table public.sales
  add column if not exists returned_qty    integer          not null default 0,
  add column if not exists returned_amount numeric          not null default 0,
  add column if not exists return_type     text,
  add column if not exists returned_at     timestamptz,
  add column if not exists returned_by     uuid;

-- 3) Atribución de la venta
--    attribution: organico | publicidad | web | offline  (null = "Sin atribuir")
--    channel    : canal de compra (web, whatsapp, tienda, dm, marketplace)
--    platform   : meta | tiktok | google | otra   (sólo si attribution=publicidad)
--    campaign   : nombre de la campaña (opcional)
alter table public.sales
  add column if not exists attribution text,
  add column if not exists channel     text,
  add column if not exists platform    text,
  add column if not exists campaign    text;

-- 4) Gasto publicitario con plataforma y campaña (se cuenta UNA sola vez)
alter table public.expenses
  add column if not exists platform text,
  add column if not exists campaign text;

-- 5) CRM: fuente de adquisición ≠ canal de compra
alter table public.customers
  add column if not exists attribution text,
  add column if not exists channel     text;
