-- Tabla de zonas
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de distribuidores
CREATE TABLE IF NOT EXISTS distributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(255),
  zone_id UUID REFERENCES zones(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(255),
  distributor_id UUID REFERENCES distributors(id),
  zone_id UUID REFERENCES zones(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de penaltis
CREATE TABLE IF NOT EXISTS penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id),
  quantity INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de penaltis
CREATE TABLE IF NOT EXISTS penalty_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  penalty_id UUID REFERENCES penalties(id),
  team_id UUID REFERENCES teams(id),
  action VARCHAR(50) NOT NULL, -- 'earned' o 'used'
  quantity INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar la tabla de perfiles para añadir la referencia a equipos
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_team 
FOREIGN KEY (team_id) 
REFERENCES teams(id);
