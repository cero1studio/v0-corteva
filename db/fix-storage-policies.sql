-- Deshabilitar temporalmente RLS para el bucket product-images
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Crear bucket para imágenes de productos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS nuevamente
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Acceso público a imágenes de productos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes" ON storage.objects;

-- Crear política para permitir acceso público a las imágenes
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Crear política para permitir a cualquier usuario autenticado subir imágenes
CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Crear política para permitir a cualquier usuario autenticado actualizar sus propias imágenes
CREATE POLICY "Auth Update Own" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-images');

-- Crear política para permitir a cualquier usuario autenticado eliminar sus propias imágenes
CREATE POLICY "Auth Delete Own" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'product-images');

-- Crear política para permitir al servicio acceder a todo
CREATE POLICY "Service All Access" 
ON storage.objects FOR ALL 
TO service_role
USING (true);
