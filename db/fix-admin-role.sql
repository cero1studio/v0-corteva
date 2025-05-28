-- Verificar el rol actual del usuario admin@corteva.com
SELECT id, email, role FROM profiles WHERE email = 'admin@corteva.com';

-- Actualizar el rol a admin si existe el usuario
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@corteva.com';

-- Verificar que el cambio se aplicó correctamente
SELECT id, email, role FROM profiles WHERE email = 'admin@corteva.com';
