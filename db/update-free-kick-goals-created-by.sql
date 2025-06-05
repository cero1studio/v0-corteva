-- Hacer el campo created_by opcional en la tabla free_kick_goals
ALTER TABLE free_kick_goals 
ALTER COLUMN created_by DROP NOT NULL;

-- Agregar comentario para documentar el cambio
COMMENT ON COLUMN free_kick_goals.created_by IS 'Usuario que creó el tiro libre (opcional)';
