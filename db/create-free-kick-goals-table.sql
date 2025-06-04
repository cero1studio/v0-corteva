-- Crear tabla para goles por tiro libre
CREATE TABLE IF NOT EXISTS free_kick_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_team_id ON free_kick_goals(team_id);
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_created_by ON free_kick_goals(created_by);
CREATE INDEX IF NOT EXISTS idx_free_kick_goals_created_at ON free_kick_goals(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE free_kick_goals ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan insertar/actualizar/eliminar
CREATE POLICY "Admins can manage free kick goals" ON free_kick_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para que todos puedan leer (para mostrar en rankings)
CREATE POLICY "Everyone can view free kick goals" ON free_kick_goals
  FOR SELECT USING (true);
