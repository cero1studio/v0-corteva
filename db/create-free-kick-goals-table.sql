-- Crear tabla para goles por tiro libre
CREATE TABLE IF NOT EXISTS free_kick_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE free_kick_goals ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan ver y modificar
CREATE POLICY "Admins can manage free kick goals" ON free_kick_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_team_id ON free_kick_goals(team_id);
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_created_at ON free_kick_goals(created_at);
