-- Verificar las constraints de la tabla competitor_clients
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'competitor_clients'::regclass 
AND contype = 'c';

-- Ver la estructura de la tabla
\d competitor_clients;
