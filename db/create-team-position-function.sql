-- Crear función para obtener la posición de un equipo en el ranking
CREATE OR REPLACE FUNCTION get_team_position(team_id_param UUID)
RETURNS TABLE (
  position INTEGER,
  team_id UUID,
  team_name TEXT,
  total_points INTEGER
) AS $$
DECLARE
  team_zone_id UUID;
  team_rank RECORD;
BEGIN
  -- Obtener la zona del equipo
  SELECT zone_id INTO team_zone_id FROM teams WHERE id = team_id_param;
  
  -- Obtener la posición del equipo en el ranking de su zona
  FOR team_rank IN (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY total_points DESC) as pos,
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
