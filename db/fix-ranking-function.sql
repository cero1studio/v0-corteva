-- Verificar si la función existe y eliminarla si es necesario
DROP FUNCTION IF EXISTS calculate_team_points(UUID);
DROP FUNCTION IF EXISTS get_team_ranking(UUID);

-- Crear función para calcular puntos de equipo de forma eficiente
CREATE OR REPLACE FUNCTION calculate_team_points(team_id UUID)
RETURNS TABLE (
  total_points BIGINT,
  sales_points BIGINT,
  clients_points BIGINT,
  free_kick_points BIGINT
) AS $$
DECLARE
  team_member_ids UUID[];
BEGIN
  -- Obtener IDs de miembros del equipo
  SELECT array_agg(id) INTO team_member_ids FROM profiles WHERE team_id = $1;
  
  RETURN QUERY
  WITH 
    -- Puntos de ventas por representante
    sales_by_rep AS (
      SELECT COALESCE(SUM(points), 0) as points
      FROM sales
      WHERE representative_id = ANY(team_member_ids)
    ),
    -- Puntos de ventas directas por equipo
    sales_by_team AS (
      SELECT COALESCE(SUM(points), 0) as points
      FROM sales
      WHERE team_id = $1
    ),
    -- Puntos de clientes por representante (sin duplicados)
    clients_by_rep AS (
      SELECT DISTINCT ON (id) id, COALESCE(points, 200) as points
      FROM competitor_clients
      WHERE representative_id = ANY(team_member_ids)
    ),
    -- Puntos de clientes directos por equipo (sin duplicados)
    clients_by_team AS (
      SELECT DISTINCT ON (id) id, COALESCE(points, 200) as points
      FROM competitor_clients
      WHERE team_id = $1 AND id NOT IN (SELECT id FROM clients_by_rep)
    ),
    -- Puntos de tiros libres
    free_kicks AS (
      SELECT COALESCE(SUM(points), 0) as points
      FROM free_kick_goals
      WHERE team_id = $1
    )
  SELECT 
    (COALESCE((SELECT points FROM sales_by_rep), 0) + 
     COALESCE((SELECT points FROM sales_by_team), 0) + 
     COALESCE((SELECT SUM(points) FROM clients_by_rep), 0) + 
     COALESCE((SELECT SUM(points) FROM clients_by_team), 0) + 
     COALESCE((SELECT points FROM free_kicks), 0)) as total_points,
    (COALESCE((SELECT points FROM sales_by_rep), 0) + 
     COALESCE((SELECT points FROM sales_by_team), 0)) as sales_points,
    (COALESCE((SELECT SUM(points) FROM clients_by_rep), 0) + 
     COALESCE((SELECT SUM(points) FROM clients_by_team), 0)) as clients_points,
    COALESCE((SELECT points FROM free_kicks), 0) as free_kick_points;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener ranking completo
CREATE OR REPLACE FUNCTION get_team_ranking(zone_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  zone_id UUID,
  zone_name TEXT,
  distributor_id UUID,
  distributor_name TEXT,
  total_points BIGINT,
  sales_points BIGINT,
  clients_points BIGINT,
  free_kick_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH team_points AS (
    SELECT 
      t.id as team_id,
      t.name as team_name,
      t.zone_id,
      z.name as zone_name,
      t.distributor_id,
      d.name as distributor_name,
      cp.total_points,
      cp.sales_points,
      cp.clients_points,
      cp.free_kick_points
    FROM teams t
    LEFT JOIN zones z ON t.zone_id = z.id
    LEFT JOIN distributors d ON t.distributor_id = d.id
    CROSS JOIN LATERAL calculate_team_points(t.id) cp
    WHERE (zone_id_param IS NULL OR t.zone_id = zone_id_param)
  )
  SELECT * FROM team_points
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql;
