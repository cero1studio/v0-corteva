-- Añadir columna total_points a la tabla teams si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'total_points') THEN
        ALTER TABLE teams ADD COLUMN total_points INTEGER DEFAULT 0;
    END IF;
END$$;

-- Crear o reemplazar la función para actualizar los puntos totales del equipo
CREATE OR REPLACE FUNCTION update_team_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar los puntos totales del equipo
    WITH team_points AS (
        SELECT 
            p.team_id,
            COALESCE(SUM(s.total_points), 0) AS total_points
        FROM 
            profiles p
            JOIN sales s ON p.id = s.user_id
        WHERE 
            p.team_id IS NOT NULL
        GROUP BY 
            p.team_id
    )
    UPDATE teams t
    SET total_points = tp.total_points
    FROM team_points tp
    WHERE t.id = tp.team_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear o reemplazar el trigger para actualizar los puntos del equipo después de insertar/actualizar/eliminar ventas
DROP TRIGGER IF EXISTS update_team_points_trigger ON sales;
CREATE TRIGGER update_team_points_trigger
AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH STATEMENT
EXECUTE FUNCTION update_team_points();

-- Ejecutar la función una vez para actualizar los puntos actuales
SELECT update_team_points();
