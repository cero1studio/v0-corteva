-- Verificar el ranking actual y de dónde vienen los puntos
SELECT 
    t.id as team_id,
    t.name as team_name,
    z.name as zone_name,
    d.name as distributor_name,
    
    -- Contar ventas
    (SELECT COUNT(*) FROM sales s WHERE s.team_id = t.id) as total_sales,
    (SELECT COALESCE(SUM(s.points), 0) FROM sales s WHERE s.team_id = t.id) as sales_points,
    
    -- Contar clientes competencia
    (SELECT COUNT(*) FROM competitor_clients cc WHERE cc.team_id = t.id) as total_clients,
    (SELECT COUNT(*) * 200 FROM competitor_clients cc WHERE cc.team_id = t.id) as clients_points,
    
    -- Contar tiros libres
    (SELECT COUNT(*) FROM free_kick_goals fkg WHERE fkg.team_id = t.id) as total_free_kicks,
    (SELECT COALESCE(SUM(fkg.points), 0) FROM free_kick_goals fkg WHERE fkg.team_id = t.id) as free_kick_points,
    
    -- Total calculado
    (SELECT COALESCE(SUM(s.points), 0) FROM sales s WHERE s.team_id = t.id) +
    (SELECT COUNT(*) * 200 FROM competitor_clients cc WHERE cc.team_id = t.id) +
    (SELECT COALESCE(SUM(fkg.points), 0) FROM free_kick_goals fkg WHERE fkg.team_id = t.id) as total_points,
    
    t.created_at
FROM teams t
LEFT JOIN zones z ON t.zone_id = z.id  
LEFT JOIN distributors d ON t.distributor_id = d.id
ORDER BY total_points DESC;
