-- Puntos de producto y ventas con decimales (PostgreSQL / Supabase).
-- Ejecutar en el SQL Editor cuando products.points / sales.points sean INTEGER.
-- Ajusta funciones que exponían total_points como entero para no perder precisión en APIs RPC.

BEGIN;

ALTER TABLE products
  ALTER COLUMN points TYPE double precision
  USING (points::double precision);

ALTER TABLE sales
  ALTER COLUMN points TYPE double precision
  USING (points::double precision);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teams'
      AND column_name = 'total_points'
  ) THEN
    ALTER TABLE teams
      ALTER COLUMN total_points TYPE double precision
      USING (COALESCE(total_points, 0)::double precision);
  END IF;
END $$;

-- Posición del equipo (usa teams.total_points)
CREATE OR REPLACE FUNCTION get_team_position(team_id_param UUID)
RETURNS TABLE (
  position INTEGER,
  team_id UUID,
  team_name TEXT,
  total_points double precision
) AS $$
DECLARE
  team_zone_id UUID;
  team_rank RECORD;
BEGIN
  SELECT zone_id INTO team_zone_id FROM teams WHERE id = team_id_param;

  FOR team_rank IN (
    SELECT
      ROW_NUMBER() OVER (ORDER BY total_points DESC) AS pos,
      id,
      name,
      total_points
    FROM teams
    WHERE zone_id = team_zone_id
    ORDER BY total_points DESC
  ) LOOP
    IF team_rank.id = team_id_param THEN
      position := team_rank.pos;
      team_id := team_rank.id;
      team_name := team_rank.name;
      total_points := team_rank.total_points;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ranking por zona (usa teams.total_points)
CREATE OR REPLACE FUNCTION get_zone_ranking(zone_id_param UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  distributor_name TEXT,
  distributor_logo TEXT,
  total_points double precision,
  goals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS team_id,
    t.name AS team_name,
    d.name AS distributor_name,
    d.logo_url AS distributor_logo,
    COALESCE(t.total_points, 0)::double precision AS total_points,
    COALESCE(t.goals, 0) AS goals
  FROM teams t
  LEFT JOIN distributors d ON t.distributor_id = d.id
  WHERE t.zone_id = zone_id_param
  ORDER BY t.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Ranking general de equipos (usa teams.total_points)
CREATE OR REPLACE FUNCTION get_team_ranking(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  zone_name TEXT,
  distributor_name TEXT,
  distributor_logo TEXT,
  total_points double precision,
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
    COALESCE(t.total_points, 0)::double precision AS total_points,
    COALESCE(t.goals, 0) AS goals
  FROM teams t
  LEFT JOIN zones z ON t.zone_id = z.id
  LEFT JOIN distributors d ON t.distributor_id = d.id
  ORDER BY t.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Agregados por distribuidor
CREATE OR REPLACE FUNCTION get_distributor_ranking()
RETURNS TABLE (
  distributor_id UUID,
  distributor_name TEXT,
  distributor_logo TEXT,
  team_count BIGINT,
  total_goals BIGINT,
  total_points double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS distributor_id,
    d.name AS distributor_name,
    d.logo_url AS distributor_logo,
    COUNT(t.id) AS team_count,
    COALESCE(SUM(t.goals), 0) AS total_goals,
    COALESCE(SUM(t.total_points), 0)::double precision AS total_points
  FROM distributors d
  LEFT JOIN teams t ON t.distributor_id = d.id
  GROUP BY d.id, d.name, d.logo_url
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql;

-- Agregados por zona
CREATE OR REPLACE FUNCTION get_zones_ranking()
RETURNS TABLE (
  zone_id UUID,
  zone_name TEXT,
  team_count BIGINT,
  total_goals BIGINT,
  total_points double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    z.id AS zone_id,
    z.name AS zone_name,
    COUNT(t.id) AS team_count,
    COALESCE(SUM(t.goals), 0) AS total_goals,
    COALESCE(SUM(t.total_points), 0)::double precision AS total_points
  FROM zones z
  LEFT JOIN teams t ON t.zone_id = z.id
  GROUP BY z.id, z.name
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql;

-- --- Variante con calculate_team_points (p. ej. db/fix-ranking-function.sql o separate-free-kicks) ---
CREATE OR REPLACE FUNCTION calculate_team_points(team_id UUID)
RETURNS TABLE (
  total_points double precision,
  sales_points double precision,
  clients_points double precision,
  free_kick_points double precision
) AS $$
DECLARE
  team_member_ids UUID[];
BEGIN
  SELECT array_agg(id) INTO team_member_ids FROM profiles WHERE team_id = $1;

  RETURN QUERY
  WITH
    sales_by_rep AS (
      SELECT COALESCE(SUM(points), 0)::double precision AS points
      FROM sales
      WHERE representative_id = ANY(team_member_ids)
    ),
    sales_by_team AS (
      SELECT COALESCE(SUM(points), 0)::double precision AS points
      FROM sales
      WHERE team_id = $1
    ),
    clients_by_rep AS (
      SELECT DISTINCT ON (id) id, COALESCE(points, 200)::double precision AS points
      FROM competitor_clients
      WHERE representative_id = ANY(team_member_ids)
    ),
    clients_by_team AS (
      SELECT DISTINCT ON (id) id, COALESCE(points, 200)::double precision AS points
      FROM competitor_clients
      WHERE team_id = $1 AND id NOT IN (SELECT id FROM clients_by_rep)
    ),
    free_kicks AS (
      SELECT COALESCE(SUM(points), 0)::double precision AS points
      FROM free_kick_goals
      WHERE team_id = $1
    )
  SELECT
    (COALESCE((SELECT points FROM sales_by_rep), 0) +
     COALESCE((SELECT points FROM sales_by_team), 0) +
     COALESCE((SELECT SUM(points) FROM clients_by_rep), 0) +
     COALESCE((SELECT SUM(points) FROM clients_by_team), 0))::double precision AS total_points,
    (COALESCE((SELECT points FROM sales_by_rep), 0) +
     COALESCE((SELECT points FROM sales_by_team), 0))::double precision AS sales_points,
    (COALESCE((SELECT SUM(points) FROM clients_by_rep), 0) +
     COALESCE((SELECT SUM(points) FROM clients_by_team), 0))::double precision AS clients_points,
    COALESCE((SELECT points FROM free_kicks), 0)::double precision AS free_kick_points;
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
  total_points double precision,
  sales_points double precision,
  clients_points double precision,
  free_kick_points double precision
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

CREATE OR REPLACE FUNCTION get_team_ranking_with_limit(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  zone_id UUID,
  zone_name TEXT,
  distributor_id UUID,
  distributor_name TEXT,
  total_points double precision,
  sales_points double precision,
  clients_points double precision,
  free_kick_points double precision
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
  total_points double precision,
  sales_points double precision,
  clients_points double precision,
  free_kick_points double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT gr.*
  FROM get_team_ranking(zone_id_param) gr
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Alinear goles almacenados en teams con total_points y umbral (puede ser decimal) en system_config
UPDATE teams t
SET goals = FLOOR(
  COALESCE(t.total_points, 0)::double precision
  / GREATEST(
    COALESCE(
      (
        SELECT (sc.value::text)::double precision
        FROM system_config sc
        WHERE sc.key = 'puntos_para_gol'
        LIMIT 1
      ),
      100::double precision
    ),
    1e-9::double precision
  )
)::integer;

COMMIT;
