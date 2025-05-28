-- Verificar si el email del admin se cambió
SELECT id, email, full_name, role 
FROM profiles 
WHERE email LIKE '%fifa%' OR email LIKE '%admin%'
ORDER BY email;
