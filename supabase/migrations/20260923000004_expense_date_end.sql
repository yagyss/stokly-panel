-- Rango de fechas para gastos que duran varios días
-- (ej: PUBLICIDAD $100.000 — del 24 de septiembre al 10 de octubre)
alter table expenses add column if not exists date_end date;
