-- Eliminar bucket existente si hay problemas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Own" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Own" ON storage.objects;
DROP POLICY IF EXISTS "Service All Access" ON storage.objects;

-- Deshabilitar RLS temporalmente
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Eliminar bucket si existe
DELETE FROM storage.buckets WHERE id = 'images';

-- Crear bucket images con configuración correcta
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 
  'images', 
  true, 
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Habilitar RLS nuevamente
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política para acceso público de lectura
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Política para que usuarios autenticados puedan subir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Política para que usuarios autenticados puedan actualizar
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Política para que usuarios autenticados puedan eliminar
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- Política para que el service role tenga acceso completo
CREATE POLICY "Service role has full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'images');
