-- Crear tabla para los tiros libres
CREATE TABLE IF NOT EXISTS free_kick_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 100,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Restricciones
  CONSTRAINT points_positive CHECK (points > 0)
);

-- Comentarios para documentación
COMMENT ON TABLE free_kick_goals IS 'Almacena los tiros libres (puntos adicionales) otorgados a los equipos';
COMMENT ON COLUMN free_kick_goals.team_id IS 'Equipo al que se le otorgan los puntos';
COMMENT ON COLUMN free_kick_goals.points IS 'Cantidad de puntos otorgados';
COMMENT ON COLUMN free_kick_goals.reason IS 'Razón por la que se otorgan los puntos';
COMMENT ON COLUMN free_kick_goals.created_by IS 'Usuario que otorgó los puntos';

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_team_id ON free_kick_goals(team_id);
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_created_at ON free_kick_goals(created_at);

-- Habilitar RLS
ALTER TABLE free_kick_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY free_kick_goals_select_policy ON free_kick_goals
  FOR SELECT USING (true);

CREATE POLICY free_kick_goals_insert_policy ON free_kick_goals
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY free_kick_goals_delete_policy ON free_kick_goals
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Función para calcular los puntos totales de tiros libres por equipo
CREATE OR REPLACE FUNCTION get_team_free_kick_points(team_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM free_kick_goals
  WHERE team_id = $1;
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;
