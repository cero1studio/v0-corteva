-- Diagnóstico completo del equipo "superganaderia"

-- 1. Verificar si el equipo existe y sus datos básicos
SELECT 
    'EQUIPO INFO' as tipo,
    t.id as team_id,
    t.name as team_name,
    t.zone_id,
    z.name as zone_name,
    t.distributor_id,
    d.name as distributor_name,
    t.created_at
FROM teams t
LEFT JOIN zones z ON t.zone_id = z.id
LEFT JOIN distributors d ON t.distributor_id = d.id
WHERE LOWER(t.name) LIKE '%superganaderia%' OR LOWER(t.name) LIKE '%super%ganaderia%'

UNION ALL

-- 2. Verificar miembros del equipo
SELECT 
    'MIEMBROS' as tipo,
    p.id as team_id,
    p.full_name as team_name,
    p.team_id as zone_id,
    p.role as zone_name,
    p.email as distributor_id,
    NULL as distributor_name,
    p.created_at
FROM profiles p
WHERE p.team_id IN (
    SELECT t.id FROM teams t 
    WHERE LOWER(t.name) LIKE '%superganaderia%' OR LOWER(t.name) LIKE '%super%ganaderia%'
)

UNION ALL

-- 3. Verificar ventas asociadas al equipo (por team_id)
SELECT 
    'VENTAS POR TEAM' as tipo,
    s.id::text as team_id,
    CONCAT('Venta: ', pr.name) as team_name,
    s.points::text as zone_id,
    s.quantity::text as zone_name,
    s.representative_id as distributor_id,
    s.team_id as distributor_name,
    s.created_at
FROM sales s
LEFT JOIN products pr ON s.product_id = pr.id
WHERE s.team_id IN (
    SELECT t.id FROM teams t 
    WHERE LOWER(t.name) LIKE '%superganaderia%' OR LOWER(t.name) LIKE '%super%ganaderia%'
)

UNION ALL

-- 4. Verificar ventas por representantes del equipo
SELECT 
    'VENTAS POR REP' as tipo,
    s.id::text as team_id,
    CONCAT('Venta Rep: ', pr.name) as team_name,
    s.points::text as zone_id,
    s.quantity::text as zone_name,
    s.representative_id as distributor_id,
    p.team_id as distributor_name,
    s.created_at
FROM sales s
LEFT JOIN products pr ON s.product_id = pr.id
LEFT JOIN profiles p ON s.representative_id = p.id
WHERE p.team_id IN (
    SELECT t.id FROM teams t 
    WHERE LOWER(t.name) LIKE '%superganaderia%' OR LOWER(t.name) LIKE '%super%ganaderia%'
)

UNION ALL

-- 5. Verificar clientes de competencia por equipo
SELECT 
    'CLIENTES POR TEAM' as tipo,
    cc.id::text as team_id,
    CONCAT('Cliente: ', cc.ganadero_name) as team_name,
    '200' as zone_id,
    cc.producto_anterior as zone_name,
    cc.representative_id as distributor_id,
    cc.team_id as distributor_name,
    cc.created_at
FROM competitor_clients cc
WHERE cc.team_id IN (
    SELECT t.id FROM teams t 
    WHERE LOWER(t.name) LIKE '%superganaderia%' OR LOWER(t.name) LIKE '%super%ganaderia%'
)

UNION ALL

-- 6. Verificar clientes por representantes del equipo
SELECT 
    'CLIENTES POR REP' as tipo,
    cc.id::text as team_id,
    CONCAT('Cliente Rep: ', cc.ganadero_name) as team_name,
    '200' as zone_id,
    cc.producto_anterior as zone_name,
    cc.representative_id as distributor_id,
    p.team_id as distributor_name,
    cc.created_at
FROM competitor_clients cc
LEFT JOIN profiles p ON cc.representative_id = p.id
WHERE p.team_id IN (
    SELECT t.id FROM teams t 
    WHERE LOWER(t.name) LIKE '%superganaderia%' OR LOWER(t.name) LIKE '%super%ganaderia%'
)

UNION ALL

-- 7. Verificar tiros libres
SELECT 
    'TIROS LIBRES' as tipo,
    fkg.id::text as team_id,
    CONCAT('Tiro libre: ', fkg.reason) as team_name,
    fkg.points::text as zone_id,
    fkg.created_by as zone_name,
    NULL as distributor_id,
    fkg.team_id as distributor_name,
    fkg.created_at
FROM free_kick_goals fkg
WHERE fkg.team_id IN (
    SELECT t.id FROM teams t 
    WHERE LOWER(t.name) LIKE '%superganaderia%' OR LOWER(t.name) LIKE '%super%ganaderia%'
)

ORDER BY tipo, created_at DESC;
