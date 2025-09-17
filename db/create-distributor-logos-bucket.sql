-- Crear bucket para logos de distribuidores
INSERT INTO storage.buckets (id, name, public)
VALUES ('distributor-logos', 'distributor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir que todos puedan ver las imágenes públicas
CREATE POLICY "Los logos de distribuidores son públicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'distributor-logos');

-- Permitir que los usuarios autenticados suban imágenes
CREATE POLICY "Los usuarios autenticados pueden subir logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'distributor-logos' AND auth.role() = 'authenticated');

-- Permitir que los usuarios autenticados actualicen sus imágenes
CREATE POLICY "Los usuarios autenticados pueden actualizar logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'distributor-logos' AND auth.role() = 'authenticated');

-- Permitir que los usuarios autenticados eliminen imágenes
CREATE POLICY "Los usuarios autenticados pueden eliminar logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'distributor-logos' AND auth.role() = 'authenticated');
