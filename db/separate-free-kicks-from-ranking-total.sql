-- Tiros libres fuera del total oficial: total_points = ventas + clientes; free_kick_points aparte.
-- Ejecutar en Supabase después de revisar. Idempotente (CREATE OR REPLACE).

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
  SELECT array_agg(id) INTO team_member_ids FROM profiles WHERE team_id = $1;

  RETURN QUERY
  WITH
    sales_by_rep AS (
      SELECT COALESCE(SUM(points), 0) AS points
      FROM sales
      WHERE representative_id = ANY(team_member_ids)
    ),
    sales_by_team AS (
      SELECT COALESCE(SUM(points), 0) AS points
      FROM sales
      WHERE team_id = $1
    ),
    clients_by_rep AS (
      SELECT DISTINCT ON (id) id, COALESCE(points, 200) AS points
      FROM competitor_clients
      WHERE representative_id = ANY(team_member_ids)
    ),
    clients_by_team AS (
      SELECT DISTINCT ON (id) id, COALESCE(points, 200) AS points
      FROM competitor_clients
      WHERE team_id = $1 AND id NOT IN (SELECT id FROM clients_by_rep)
    ),
    free_kicks AS (
      SELECT COALESCE(SUM(points), 0) AS points
      FROM free_kick_goals
      WHERE team_id = $1
    )
  SELECT
    (COALESCE((SELECT points FROM sales_by_rep), 0) +
     COALESCE((SELECT points FROM sales_by_team), 0) +
     COALESCE((SELECT SUM(points) FROM clients_by_rep), 0) +
     COALESCE((SELECT SUM(points) FROM clients_by_team), 0)) AS total_points,
    (COALESCE((SELECT points FROM sales_by_rep), 0) +
     COALESCE((SELECT points FROM sales_by_team), 0)) AS sales_points,
    (COALESCE((SELECT SUM(points) FROM clients_by_rep), 0) +
     COALESCE((SELECT SUM(points) FROM clients_by_team), 0)) AS clients_points,
    COALESCE((SELECT points FROM free_kicks), 0) AS free_kick_points;
END;
$$ LANGUAGE plpgsql;

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
      t.id AS team_id,
      t.name AS team_name,
      t.zone_id,
      z.name AS zone_name,
      t.distributor_id,
      d.name AS distributor_name,
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

-- Wrappers usados por /api/ranking-list (misma firma de retorno que get_team_ranking)
CREATE OR REPLACE FUNCTION get_team_ranking_with_limit(limit_count INTEGER DEFAULT 100)
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
  SELECT gr.*
  FROM get_team_ranking(NULL::UUID) gr
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_zone_ranking_with_limit(zone_id_param UUID, limit_count INTEGER DEFAULT 100)
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
  SELECT gr.*
  FROM get_team_ranking(zone_id_param) gr
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

UPDATE system_config
SET value = 'false', updated_at = NOW()
WHERE key = 'free_kicks_count_as_goals';
