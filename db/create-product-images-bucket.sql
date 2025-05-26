-- Crear bucket para imágenes de productos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Establecer política para acceso público a imágenes de productos
CREATE POLICY "Acceso público a imágenes de productos" ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Crear política para permitir a usuarios autenticados subir imágenes de productos
CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Crear política para permitir a usuarios autenticados actualizar imágenes
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Crear política para permitir a usuarios autenticados eliminar imágenes
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Crear función para crear políticas de almacenamiento
CREATE OR REPLACE FUNCTION create_storage_policy(
  bucket_name TEXT,
  policy_name TEXT,
  definition TEXT,
  operation TEXT,
  role_name TEXT
) RETURNS VOID AS $$
BEGIN
  -- Verificar si la política ya existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = policy_name AND bucket_id = bucket_name
  ) THEN
    -- Crear la política
    INSERT INTO storage.policies (name, definition, bucket_id, operation, role)
    VALUES (
      policy_name,
      definition,
      bucket_name,
      operation,
      role_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
