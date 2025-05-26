-- Asegurarse de que existe la tabla system_config
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar o actualizar la configuración de puntos por gol
INSERT INTO system_config (key, value, description)
VALUES ('puntos_para_gol', '100', 'Número de puntos necesarios para anotar un gol')
ON CONFLICT (key) 
DO UPDATE SET 
  value = '100',
  description = 'Número de puntos necesarios para anotar un gol',
  updated_at = NOW();
