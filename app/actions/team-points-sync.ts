"use server"

import { adminSupabase } from "@/lib/supabase/server"
import { contestGoalsFromPoints, parsePuntosParaGol, toContestPoints } from "@/lib/goals"
import { rankingCache } from "@/lib/ranking-cache"

/** Misma regla que en ranking: puntos de competencia por cliente capturado. */
const PUNTOS_POR_CLIENTE_COMPETENCIA = 200

/**
 * Recalcula `teams.total_points` y `teams.goals` desde ventas + clientes de competencia.
 * No incluye tiros libres (igual que el ranking para goles del concurso).
 */
export async function reconcileTeamContestTotals(teamId: string | null | undefined): Promise<void> {
  if (!teamId) return

  const { data: puntosRow } = await adminSupabase
    .from("system_config")
    .select("value")
    .eq("key", "puntos_para_gol")
    .maybeSingle()

  const puntosParaGol = parsePuntosParaGol((puntosRow as { value?: unknown } | null)?.value)

  const { data: members } = await adminSupabase.from("profiles").select("id").eq("team_id", teamId)
  const memberIds = (members ?? []).map((m) => (m as { id: string }).id)

  let totalSalesPoints = 0
  const { data: salesByTeam } = await adminSupabase.from("sales").select("points").eq("team_id", teamId)
  for (const row of salesByTeam ?? []) {
    totalSalesPoints += toContestPoints((row as { points: unknown }).points)
  }

  if (memberIds.length > 0) {
    const { data: orphanSales } = await adminSupabase
      .from("sales")
      .select("points")
      .in("representative_id", memberIds)
      .is("team_id", null)
    for (const row of orphanSales ?? []) {
      totalSalesPoints += toContestPoints((row as { points: unknown }).points)
    }
  }

  const clientIds = new Set<string>()
  const { data: clientsByTeam } = await adminSupabase.from("competitor_clients").select("id").eq("team_id", teamId)
  for (const c of clientsByTeam ?? []) clientIds.add((c as { id: string }).id)

  if (memberIds.length > 0) {
    const { data: clientsByRep } = await adminSupabase
      .from("competitor_clients")
      .select("id")
      .in("representative_id", memberIds)
    for (const c of clientsByRep ?? []) clientIds.add((c as { id: string }).id)
  }

  const totalClientsPoints = clientIds.size * PUNTOS_POR_CLIENTE_COMPETENCIA
  const pointsForGoals = totalSalesPoints + totalClientsPoints
  const goals = contestGoalsFromPoints(pointsForGoals, puntosParaGol)

  await adminSupabase
    .from("teams")
    .update({ total_points: pointsForGoals, goals } as never)
    .eq("id", teamId)

  rankingCache.clear()
}
