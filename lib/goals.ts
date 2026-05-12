/**
 * Cálculo de goles del concurso con puntos decimales (productos, ventas, umbral por gol).
 * Un gol completo = floor(puntos_oficiales / puntos_para_gol), con umbral > 0.
 */

const DEFAULT_PUNTOS_PARA_GOL = 100
/** Evita floor(199.9999999/100)=1 en casos raros de coma flotante. */
const FLOOR_EPS = 1e-9

/** Lee puntos por gol desde system_config u otro valor (número, string JSON, coma decimal). */
export function parsePuntosParaGol(raw: unknown): number {
  if (raw == null || raw === "") return DEFAULT_PUNTOS_PARA_GOL
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw
  const s = String(raw).trim().replace(",", ".")
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PUNTOS_PARA_GOL
  return n
}

/** Coerce a número para sumas desde Supabase (numeric puede llegar como string). */
export function toContestPoints(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number.parseFloat(value.trim().replace(",", "."))
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Goles completos: parte entera de (puntos oficiales / umbral). */
export function contestGoalsFromPoints(pointsForGoals: number, puntosParaGol: number): number {
  const t =
    puntosParaGol > 0 && Number.isFinite(puntosParaGol) ? puntosParaGol : DEFAULT_PUNTOS_PARA_GOL
  const p = toContestPoints(pointsForGoals)
  if (p <= 0) return 0
  return Math.floor((p + FLOOR_EPS) / t)
}

/** Puntos dentro del ciclo actual hacia el siguiente gol (en [0, t) salvo errores de float). */
export function contestPointsRemainder(pointsForGoals: number, puntosParaGol: number): number {
  const t =
    puntosParaGol > 0 && Number.isFinite(puntosParaGol) ? puntosParaGol : DEFAULT_PUNTOS_PARA_GOL
  const p = Math.max(0, toContestPoints(pointsForGoals))
  const g = contestGoalsFromPoints(p, t)
  const r = p - g * t
  return Math.max(0, r)
}

/** Puntos que faltan para completar el próximo gol (si remainder≈0, cuenta un ciclo completo). */
export function contestPointsUntilNextGoal(pointsForGoals: number, puntosParaGol: number): number {
  const t =
    puntosParaGol > 0 && Number.isFinite(puntosParaGol) ? puntosParaGol : DEFAULT_PUNTOS_PARA_GOL
  const r = contestPointsRemainder(pointsForGoals, t)
  const nearZero = r <= FLOOR_EPS * Math.max(t, 1)
  return nearZero ? t : t - r
}

/** Goles “enteros” mínimos para superar un desfase de puntos (p. ej. alcanzar al de arriba). */
export function contestGoalsToClosePointsGap(deltaPoints: number, puntosParaGol: number): number {
  const t =
    puntosParaGol > 0 && Number.isFinite(puntosParaGol) ? puntosParaGol : DEFAULT_PUNTOS_PARA_GOL
  const d = toContestPoints(deltaPoints)
  if (d <= 0) return 0
  return Math.ceil((d - FLOOR_EPS) / t)
}
