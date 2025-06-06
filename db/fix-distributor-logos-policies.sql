-- Crear bucket para logos de distribuidores si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('distributor-logos', 'distributor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view distributor logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload distributor logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update distributor logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete distributor logos" ON storage.objects;

-- Política para ver logos de distribuidores (público)
CREATE POLICY "Anyone can view distributor logos" ON storage.objects
FOR SELECT USING (bucket_id = 'distributor-logos');

-- Política para subir logos de distribuidores (solo autenticados)
CREATE POLICY "Authenticated users can upload distributor logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'distributor-logos' 
  AND auth.role() = 'authenticated'
);

-- Política para actualizar logos de distribuidores (solo autenticados)
CREATE POLICY "Authenticated users can update distributor logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'distributor-logos' 
  AND auth.role() = 'authenticated'
);

-- Política para eliminar logos de distribuidores (solo autenticados)
CREATE POLICY "Authenticated users can delete distributor logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'distributor-logos' 
  AND auth.role() = 'authenticated'
);
