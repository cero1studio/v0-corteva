-- Verificar el ranking CORRECTO - buscando ventas por representative_id
WITH team_stats AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    z.name as zone_name,
    d.name as distributor_name,
    
    -- Obtener IDs de miembros del equipo
    ARRAY_AGG(p.id) FILTER (WHERE p.id IS NOT NULL) as member_ids,
    
    t.created_at
  FROM teams t
  LEFT JOIN zones z ON t.zone_id = z.id  
  LEFT JOIN distributors d ON t.distributor_id = d.id
  LEFT JOIN profiles p ON p.team_id = t.id
  GROUP BY t.id, t.name, z.name, d.name, t.created_at
),
team_points AS (
  SELECT 
    ts.*,
    
    -- Ventas por representative_id (miembros del equipo)
    COALESCE((
      SELECT SUM(s.points) 
      FROM sales s 
      WHERE s.representative_id = ANY(ts.member_ids)
    ), 0) as sales_points_by_rep,
    
    -- Ventas directas por team_id
    COALESCE((
      SELECT SUM(s.points) 
      FROM sales s 
      WHERE s.team_id = ts.team_id
    ), 0) as sales_points_by_team,
    
    -- Clientes por representative_id
    COALESCE((
      SELECT COUNT(DISTINCT cc.id) * 200
      FROM competitor_clients cc 
      WHERE cc.representative_id = ANY(ts.member_ids)
    ), 0) as clients_points_by_rep,
    
    -- Clientes directos por team_id  
    COALESCE((
      SELECT COUNT(DISTINCT cc.id) * 200
      FROM competitor_clients cc 
      WHERE cc.team_id = ts.team_id
    ), 0) as clients_points_by_team,
    
    -- Tiros libres
    COALESCE((
      SELECT SUM(fkg.points) 
      FROM free_kick_goals fkg 
      WHERE fkg.team_id = ts.team_id
    ), 0) as free_kick_points
    
  FROM team_stats ts
)
SELECT 
  *,
  (sales_points_by_rep + sales_points_by_team + clients_points_by_rep + clients_points_by_team + free_kick_points) as total_points,
  FLOOR((sales_points_by_rep + sales_points_by_team + clients_points_by_rep + clients_points_by_team + free_kick_points) / 100) as goals
FROM team_points
WHERE (sales_points_by_rep + sales_points_by_team + clients_points_by_rep + clients_points_by_team + free_kick_points) > 0
ORDER BY total_points DESC;
