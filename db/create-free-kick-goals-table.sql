-- Crear tabla para goles por tiro libre
CREATE TABLE IF NOT EXISTS free_kick_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE free_kick_goals ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan gestionar tiros libres
CREATE POLICY "Admins can manage free kick goals" ON free_kick_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para que todos puedan leer (para mostrar en rankings y dashboards)
CREATE POLICY "Everyone can view free kick goals" ON free_kick_goals
  FOR SELECT USING (true);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_team_id ON free_kick_goals(team_id);
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_created_at ON free_kick_goals(created_at);
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_created_by ON free_kick_goals(created_by);

-- Comentarios para documentación
COMMENT ON TABLE free_kick_goals IS 'Tabla para almacenar goles por tiro libre adjudicados por administradores';
COMMENT ON COLUMN free_kick_goals.team_id IS 'ID del equipo que recibe el tiro libre';
COMMENT ON COLUMN free_kick_goals.points IS 'Puntos otorgados por el tiro libre';
COMMENT ON COLUMN free_kick_goals.reason IS 'Razón por la cual se otorga el tiro libre';
COMMENT ON COLUMN free_kick_goals.created_by IS 'ID del administrador que otorgó el tiro libre';
