-- Inspeccionar la estructura de la tabla sales
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales';
