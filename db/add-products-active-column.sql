-- Estado activo/inactivo del catálogo de productos (listados con .eq("active", true)).
ALTER TABLE products ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN products.active IS 'Si false, el producto no aparece en registro de ventas ni listados activos';
