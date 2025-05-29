-- Modificar la tabla competitor_clients con los nuevos campos
ALTER TABLE competitor_clients 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS previous_supplier,
DROP COLUMN IF EXISTS contact_info;

-- Agregar los nuevos campos
ALTER TABLE competitor_clients 
ADD COLUMN ganadero_name VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN razon_social VARCHAR(255),
ADD COLUMN tipo_venta VARCHAR(50) CHECK (tipo_venta IN ('Venta Directa', 'Venta por Almacén')),
ADD COLUMN ubicacion_finca TEXT,
ADD COLUMN area_finca_hectareas DECIMAL(10,2),
ADD COLUMN producto_anterior VARCHAR(255),
ADD COLUMN producto_super_ganaderia VARCHAR(50) CHECK (producto_super_ganaderia IN ('Combatran XT', 'Pastar D')),
ADD COLUMN volumen_venta_estimado VARCHAR(255);

-- Actualizar registros existentes si los hay
UPDATE competitor_clients 
SET ganadero_name = 'Cliente Migrado'
WHERE ganadero_name = '';
