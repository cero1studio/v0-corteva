"use server"

import { createServerClient } from "@/lib/supabase/server"

export interface TeamRanking {
  position: number
  team_id: string
  team_name: string
  distributor_name: string
  distributor_logo?: string
  goals: number
  total_points: number
  zone_name: string
}

export interface SalesRanking {
  position: number
  team_id: string
  team_name: string
  distributor_name: string
  total_sales: number
  total_points: number // Cambiado de total_amount a total_points
  zone_name: string
}

export interface ClientsRanking {
  position: number
  team_id: string
  team_name: string
  distributor_name: string
  total_clients: number
  total_points_from_clients: number
  zone_name: string
}

export interface UserTeamInfo {
  team_id: string
  team_name: string
  zone_id: string
  zone_name: string
  position: number
  goals: number
  total_points: number
  goals_to_next_position: number
}

export async function getTeamRankingByZone(zoneId?: string) {
  try {
    const supabase = createServerClient()

    let query = supabase
      .from("teams")
      .select(`
        id,
        name,
        goals,
        total_points,
        zones!inner(id, name),
        distributors!inner(id, name, logo_url)
      `)
      .order("total_points", { ascending: false })

    if (zoneId) {
      query = query.eq("zone_id", zoneId)
    }

    const { data: teams, error } = await query

    if (error) {
      console.error("Error fetching team ranking:", error)
      return { success: false, error: error.message }
    }

    const ranking: TeamRanking[] =
      teams?.map((team, index) => ({
        position: index + 1,
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        distributor_logo: team.distributors.logo_url,
        goals: team.goals || 0,
        total_points: team.total_points || 0,
        zone_name: team.zones.name,
      })) || []

    return { success: true, data: ranking }
  } catch (error) {
    console.error("Error in getTeamRankingByZone:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getSalesRankingByZone(zoneId?: string) {
  try {
    const supabase = createServerClient()

    // Primero obtener todos los equipos de la zona
    let teamsQuery = supabase.from("teams").select(`
        id,
        name,
        zones!inner(id, name),
        distributors!inner(id, name, logo_url)
      `)

    if (zoneId) {
      teamsQuery = teamsQuery.eq("zone_id", zoneId)
    }

    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error("Error fetching teams for sales ranking:", teamsError)
      return { success: false, error: teamsError.message }
    }

    // Luego obtener las ventas para cada equipo usando representative_id
    const ranking: SalesRanking[] = []

    for (const team of teams || []) {
      // Obtener todos los representantes del equipo
      const { data: representatives, error: repsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("team_id", team.id)

      if (repsError) {
        console.error(`Error fetching representatives for team ${team.id}:`, repsError)
        continue
      }

      let totalSales = 0
      let totalPoints = 0

      // Obtener ventas de todos los representantes del equipo
      for (const rep of representatives || []) {
        const { data: sales, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("representative_id", rep.id)

        if (!salesError && sales) {
          totalSales += sales.length
          // Sumar puntos en lugar de monto monetario
          totalPoints += sales.reduce((sum, sale) => sum + (sale.points || 0), 0)
        }
      }

      ranking.push({
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        total_sales: totalSales,
        total_points: totalPoints, // Ahora representa puntos totales
        zone_name: team.zones.name,
      })
    }

    // Ordenar por puntos totales (de mayor a menor) y asignar posiciones
    const sortedRanking = ranking
      .sort((a, b) => b.total_points - a.total_points)
      .map((team, index) => ({
        ...team,
        position: index + 1,
      }))

    return { success: true, data: sortedRanking }
  } catch (error) {
    console.error("Error in getSalesRankingByZone:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getClientsRankingByZone(zoneId?: string) {
  try {
    const supabase = createServerClient()

    // Primero obtener todos los equipos de la zona
    let teamsQuery = supabase.from("teams").select(`
        id,
        name,
        zones!inner(id, name),
        distributors!inner(id, name, logo_url)
      `)

    if (zoneId) {
      teamsQuery = teamsQuery.eq("zone_id", zoneId)
    }

    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error("Error fetching teams for clients ranking:", teamsError)
      return { success: false, error: teamsError.message }
    }

    // Luego obtener el conteo de clientes para cada equipo
    const ranking: ClientsRanking[] = []

    for (const team of teams || []) {
      // Obtener todos los representantes del equipo
      const { data: representatives, error: repsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("team_id", team.id)

      if (repsError) {
        console.error(`Error fetching representatives for team ${team.id}:`, repsError)
        continue
      }

      let totalClients = 0

      // Obtener clientes de todos los representantes del equipo
      for (const rep of representatives || []) {
        const { count: clientsCount, error: clientsError } = await supabase
          .from("competitor_clients")
          .select("*", { count: "exact", head: true })
          .eq("representative_id", rep.id)

        if (!clientsError) {
          totalClients += clientsCount || 0
        }
      }

      const totalPointsFromClients = totalClients * 200 // 2 goles = 200 puntos cada cliente

      ranking.push({
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        total_clients: totalClients,
        total_points_from_clients: totalPointsFromClients,
        zone_name: team.zones.name,
      })
    }

    // Ordenar por número de clientes y asignar posiciones
    const sortedRanking = ranking
      .sort((a, b) => b.total_clients - a.total_clients)
      .map((team, index) => ({
        ...team,
        position: index + 1,
      }))

    return { success: true, data: sortedRanking }
  } catch (error) {
    console.error("Error in getClientsRankingByZone:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getUserTeamInfo(
  userId: string,
): Promise<{ success: boolean; data?: UserTeamInfo; error?: string }> {
  try {
    const supabase = createServerClient()

    console.log("Buscando usuario con ID:", userId)

    // Primero verificar si el usuario existe en profiles
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    console.log("Profile encontrado:", profile)
    console.log("Error de profile:", profileError)

    if (profileError) {
      return { success: false, error: `Error al buscar usuario: ${profileError.message}` }
    }

    if (!profile) {
      return { success: false, error: "Usuario no encontrado en profiles" }
    }

    if (!profile.team_id) {
      return { success: false, error: "Usuario no tiene equipo asignado" }
    }

    // Obtener información del equipo
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        goals,
        total_points,
        zone_id,
        zones!inner(name)
      `)
      .eq("id", profile.team_id)
      .single()

    console.log("Team encontrado:", team)
    console.log("Error de team:", teamError)

    if (teamError || !team) {
      return { success: false, error: "Error al obtener información del equipo" }
    }

    const zoneId = team.zone_id

    // Obtener ranking de la zona para calcular la posición
    const rankingResult = await getTeamRankingByZone(zoneId)

    if (!rankingResult.success || !rankingResult.data) {
      return { success: false, error: "Error al obtener ranking" }
    }

    const teamPosition = rankingResult.data.find((t) => t.team_id === team.id)
    const nextTeam = rankingResult.data.find((t) => t.position === (teamPosition?.position || 1) - 1)

    const goalsToNext = nextTeam ? Math.max(0, nextTeam.total_points - team.total_points) : 0

    const userTeamInfo: UserTeamInfo = {
      team_id: team.id,
      team_name: team.name,
      zone_id: zoneId,
      zone_name: team.zones.name,
      position: teamPosition?.position || 0,
      goals: team.goals || 0,
      total_points: team.total_points || 0,
      goals_to_next_position: goalsToNext,
    }

    return { success: true, data: userTeamInfo }
  } catch (error) {
    console.error("Error in getUserTeamInfo:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getProducts() {
  try {
    const supabase = createServerClient()

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name")
      .eq("active", true)
      .order("name")

    if (error) {
      console.error("Error fetching products:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: products || [] }
  } catch (error) {
    console.error("Error in getProducts:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
