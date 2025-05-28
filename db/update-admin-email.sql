-- Actualizar el email del administrador específicamente
UPDATE profiles 
SET email = 'fifa@llevolasriendas.com'
WHERE email = 'admin@corteva.com' AND role = 'admin';

-- Verificar el cambio
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'fifa@llevolasriendas.com';
