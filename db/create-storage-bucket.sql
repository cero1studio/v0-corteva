-- Crear bucket para imágenes de productos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Establecer política para acceso público a imágenes de productos
CREATE POLICY "Imágenes de productos accesibles públicamente" ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Crear política para permitir a usuarios autenticados subir imágenes de productos
CREATE POLICY "Usuarios autenticados pueden subir imágenes de productos" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Crear política para permitir a usuarios autenticados actualizar sus propias imágenes de productos
CREATE POLICY "Usuarios autenticados pueden actualizar sus imágenes de productos" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Crear política para permitir a usuarios autenticados eliminar sus propias imágenes de productos
CREATE POLICY "Usuarios autenticados pueden eliminar sus imágenes de productos" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'products');
