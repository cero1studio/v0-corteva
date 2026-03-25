-- Configuración: si los tiros libres suman a los goles (true) o se premian aparte (false).
-- Por defecto true para mantener comportamiento actual del concurso 2025.
-- En concursos nuevos se puede setear false para que tiros libres no sumen goles.
INSERT INTO system_config (key, value, description)
VALUES (
  'free_kicks_count_as_goals',
  'true',
  'Si es true, los puntos de tiros libres suman al total que se convierte en goles. Si es false, los tiros libres se contabilizan y premian aparte sin afectar goles.'
)
ON CONFLICT (key)
DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();
