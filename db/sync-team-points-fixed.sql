-- Script para sincronizar puntos de equipos
-- Ejecutar manualmente en Supabase cuando sea necesario

-- Actualizar total_points de todos los equipos basado en:
-- 1. Puntos de ventas
-- 2. Puntos de clientes de competencia  
-- 3. Puntos de tiros libres (free_kick_goals)

UPDATE teams 
SET total_points = COALESCE(
  (
    -- Sumar puntos de ventas
    SELECT COALESCE(SUM(s.points), 0)
    FROM sales s 
    WHERE s.team_id = teams.id
  ) + 
  (
    -- Sumar puntos de clientes de competencia
    SELECT COALESCE(SUM(cc.points), 0)
    FROM competitor_clients cc 
    WHERE cc.team_id = teams.id
  ) + 
  (
    -- Sumar puntos de tiros libres
    SELECT COALESCE(SUM(fkg.points), 0)
    FROM free_kick_goals fkg 
    WHERE fkg.team_id = teams.id
  ), 0
);

-- Verificar resultados
SELECT 
  t.id,
  t.name,
  t.total_points as puntos_actuales,
  (
    COALESCE((SELECT SUM(s.points) FROM sales s WHERE s.team_id = t.id), 0) +
    COALESCE((SELECT SUM(cc.points) FROM competitor_clients cc WHERE cc.team_id = t.id), 0) +
    COALESCE((SELECT SUM(fkg.points) FROM free_kick_goals fkg WHERE fkg.team_id = t.id), 0)
  ) as puntos_calculados
FROM teams t
ORDER BY t.total_points DESC;
