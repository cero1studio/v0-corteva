import { createClient } from "@/lib/supabase/client"

interface TeamRanking {
  team: string
  points: number
  goals_favor: number
  goals_against: number
  goals_difference: number
}

export async function getTeamRankingByZone(zone: string): Promise<TeamRanking[]> {
  const supabase = createClient()

  try {
    // Obtener equipos de la zona específica
    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        total_points,
        zone:zones!inner(name)
      `)
      .eq("zones.name", zone)

    if (error) {
      console.error("Error fetching teams by zone:", error)
      throw new Error("Error fetching teams by zone")
    }

    // Transformar los datos al formato esperado
    const ranking: TeamRanking[] =
      teams?.map((team) => ({
        team: team.name,
        points: team.total_points || 0,
        goals_favor: team.total_points || 0, // Usando total_points como goles a favor
        goals_against: 0, // Por ahora en 0
        goals_difference: team.total_points || 0,
      })) || []

    // Ordenar por puntos descendente
    return ranking.sort((a, b) => b.points - a.points)
  } catch (error) {
    console.error("Error in getTeamRankingByZone:", error)
    throw error
  }
}
