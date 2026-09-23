-- Código de barras por variante de producto (para escanear la etiqueta de la prenda)
alter table products add column if not exists barcode text;
