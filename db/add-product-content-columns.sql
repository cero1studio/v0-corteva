-- Contenido físico por unidad vendida (envase): kg o litros.
-- Ej.: 20 L por garrafa → content_per_unit = 20, content_unit = 'l'.
-- La venta muestra cantidad × content_per_unit con la unidad indicada.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS content_per_unit double precision NULL,
  ADD COLUMN IF NOT EXISTS content_unit text NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_content_unit_check') THEN
    ALTER TABLE products DROP CONSTRAINT products_content_unit_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_content_pair_check') THEN
    ALTER TABLE products DROP CONSTRAINT products_content_pair_check;
  END IF;
END $$;

ALTER TABLE products ADD CONSTRAINT products_content_unit_check
  CHECK (content_unit IS NULL OR content_unit IN ('kg', 'l'));

ALTER TABLE products ADD CONSTRAINT products_content_pair_check
  CHECK (
    (content_per_unit IS NULL AND content_unit IS NULL)
    OR (
      content_per_unit IS NOT NULL
      AND content_unit IS NOT NULL
      AND content_per_unit > 0
    )
  );

COMMENT ON COLUMN products.content_per_unit IS 'Kilogramos o litros por cada unidad vendida (envase)';
COMMENT ON COLUMN products.content_unit IS 'kg o l (litros)';
