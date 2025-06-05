import { createClient } from "@/lib/supabase/client"
import type { Zone } from "@/types"

interface RankingItem {
  teamName: string
  zone: Zone
  points: number
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export async function getTeamRankingByZone(): Promise<RankingItem[]> {
  const supabase = createClient()

  try {
    // Obtener todos los equipos con sus zonas
    const { data: teams, error: teamsError } = await supabase.from("teams").select(`
        id,
        name,
        zone:zones(name),
        total_points
      `)

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      throw new Error("Error fetching teams")
    }

    // Transformar los datos al formato esperado
    const ranking: RankingItem[] =
      teams?.map((team) => ({
        teamName: team.name,
        zone: team.zone?.name || "Sin zona",
        points: team.total_points || 0,
        matchesPlayed: 0, // Por ahora en 0, se puede calcular después
        wins: 0,
        losses: 0,
        draws: 0,
        goalsFor: team.total_points || 0, // Usando total_points como goles
        goalsAgainst: 0,
        goalDifference: team.total_points || 0,
      })) || []

    // Ordenar por puntos descendente
    return ranking.sort((a, b) => b.points - a.points)
  } catch (error) {
    console.error("Error in getTeamRankingByZone:", error)
    throw error
  }
}
