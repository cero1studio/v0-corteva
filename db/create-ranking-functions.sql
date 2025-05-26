-- Función para obtener el ranking de distribuidores
CREATE OR REPLACE FUNCTION get_distributor_ranking()
RETURNS TABLE (
  distributor_id UUID,
  distributor_name TEXT,
  distributor_logo TEXT,
  team_count BIGINT,
  total_goals BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id AS distributor_id,
    d.name AS distributor_name,
    d.logo_url AS distributor_logo,
    COUNT(t.id) AS team_count,
    COALESCE(SUM(t.goals), 0) AS total_goals,
    COALESCE(SUM(t.total_points), 0) AS total_points
  FROM 
    distributors d
  LEFT JOIN 
    teams t ON t.distributor_id = d.id
  GROUP BY 
    d.id, d.name, d.logo_url
  ORDER BY 
    total_points DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el ranking por zona
CREATE OR REPLACE FUNCTION get_zone_ranking(zone_id_param UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  distributor_name TEXT,
  distributor_logo TEXT,
  total_points BIGINT,
  goals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    d.name AS distributor_name,
    d.logo_url AS distributor_logo,
    COALESCE(t.total_points, 0) AS total_points,
    COALESCE(t.goals, 0) AS goals
  FROM 
    teams t
  LEFT JOIN 
    distributors d ON t.distributor_id = d.id
  WHERE 
    t.zone_id = zone_id_param
  ORDER BY 
    t.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el ranking general de equipos
CREATE OR REPLACE FUNCTION get_team_ranking(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  zone_name TEXT,
  distributor_name TEXT,
  distributor_logo TEXT,
  total_points BIGINT,
  goals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    z.name AS zone_name,
    d.name AS distributor_name,
    d.logo_url AS distributor_logo,
    COALESCE(t.total_points, 0) AS total_points,
    COALESCE(t.goals, 0) AS goals
  FROM 
    teams t
  LEFT JOIN 
    zones z ON t.zone_id = z.id
  LEFT JOIN 
    distributors d ON t.distributor_id = d.id
  ORDER BY 
    t.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el ranking de zonas
CREATE OR REPLACE FUNCTION get_zones_ranking()
RETURNS TABLE (
  zone_id UUID,
  zone_name TEXT,
  team_count BIGINT,
  total_goals BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    z.id AS zone_id,
    z.name AS zone_name,
    COUNT(t.id) AS team_count,
    COALESCE(SUM(t.goals), 0) AS total_goals,
    COALESCE(SUM(t.total_points), 0) AS total_points
  FROM 
    zones z
  LEFT JOIN 
    teams t ON t.zone_id = z.id
  GROUP BY 
    z.id, z.name
  ORDER BY 
    total_points DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener ventas por equipo en una zona
CREATE OR REPLACE FUNCTION get_sales_by_team_in_zone(zone_id_param UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  total_sales BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    COUNT(s.id) AS total_sales,
    COALESCE(SUM(s.total_points), 0) AS total_points
  FROM 
    teams t
  LEFT JOIN 
    profiles p ON p.team_id = t.id
  LEFT JOIN 
    sales s ON s.user_id = p.id
  WHERE 
    t.zone_id = zone_id_param
  GROUP BY 
    t.id, t.name
  ORDER BY 
    total_points DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener clientes captados por equipo en una zona
CREATE OR REPLACE FUNCTION get_clients_by_team_in_zone(zone_id_param UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  total_clients BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    COUNT(c.id) AS total_clients
  FROM 
    teams t
  LEFT JOIN 
    profiles p ON p.team_id = t.id
  LEFT JOIN 
    competitor_clients c ON c.captured_by = p.id
  WHERE 
    t.zone_id = zone_id_param
  GROUP BY 
    t.id, t.name
  ORDER BY 
    total_clients DESC;
END;
$$ LANGUAGE plpgsql;
