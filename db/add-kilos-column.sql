-- Agregar columna kilos a la tabla sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS kilos NUMERIC;
