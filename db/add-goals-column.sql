-- Añadir columna goals a la tabla teams si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'goals'
  ) THEN
    ALTER TABLE teams ADD COLUMN goals INTEGER DEFAULT 0;
  END IF;
END $$;
