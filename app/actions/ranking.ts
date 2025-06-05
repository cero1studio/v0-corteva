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
  total_points: number
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

    // Obtener configuración de puntos para gol
    const { data: puntosConfig } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "puntos_para_gol")
      .maybeSingle()

    const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

    // Obtener equipos con sus zonas y distribuidores
    let teamsQuery = supabase.from("teams").select(`
        id,
        name,
        zone_id,
        zones!inner(id, name),
        distributors!inner(id, name, logo_url)
      `)

    if (zoneId) {
      teamsQuery = teamsQuery.eq("zone_id", zoneId)
    }

    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error("Error fetching teams for ranking:", teamsError)
      return { success: false, error: teamsError.message }
    }

    // Calcular puntos reales de ventas para cada equipo
    const ranking: TeamRanking[] = []

    for (const team of teams || []) {
      console.log(`Calculando puntos para equipo: ${team.name}`)

      // Obtener miembros del equipo
      const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)
      const memberIds = teamMembers?.map((member) => member.id) || []
      console.log(`Miembros del equipo ${team.name}:`, memberIds)

      // 1. OBTENER PUNTOS DE VENTAS - BUSCAR POR AMBOS CAMPOS
      let totalSalesPoints = 0

      // Buscar ventas por representative_id (miembros del equipo)
      if (memberIds.length > 0) {
        const { data: salesByRep, error: salesRepError } = await supabase
          .from("sales")
          .select("points")
          .in("representative_id", memberIds)

        if (!salesRepError && salesByRep) {
          totalSalesPoints += salesByRep.reduce((sum, sale) => sum + (sale.points || 0), 0)
        }
      }

      // Buscar ventas directas por team_id
      const { data: salesByTeam, error: salesTeamError } = await supabase
        .from("sales")
        .select("points")
        .eq("team_id", team.id)

      if (!salesTeamError && salesByTeam) {
        totalSalesPoints += salesByTeam.reduce((sum, sale) => sum + (sale.points || 0), 0)
      }

      console.log(`Puntos de ventas para ${team.name}:`, totalSalesPoints)

      // 2. OBTENER PUNTOS DE CLIENTES DE COMPETENCIA
      let totalClientsPoints = 0

      // IMPORTANTE: Evitar contar clientes duplicados
      // Crear un conjunto para almacenar IDs de clientes ya contados
      const countedClientIds = new Set()

      // Obtener clientes por representative_id
      if (memberIds.length > 0) {
        const { data: clientsByRep } = await supabase
          .from("competitor_clients")
          .select("id, points")
          .in("representative_id", memberIds)

        if (clientsByRep) {
          for (const client of clientsByRep) {
            if (!countedClientIds.has(client.id)) {
              totalClientsPoints += client.points || 200
              countedClientIds.add(client.id)
            }
          }
        }
      }

      // Obtener clientes por team_id
      const { data: clientsByTeam } = await supabase
        .from("competitor_clients")
        .select("id, points")
        .eq("team_id", team.id)

      if (clientsByTeam) {
        for (const client of clientsByTeam) {
          if (!countedClientIds.has(client.id)) {
            totalClientsPoints += client.points || 200
            countedClientIds.add(client.id)
          }
        }
      }

      console.log(`Puntos de clientes para ${team.name}:`, totalClientsPoints)

      // 3. OBTENER PUNTOS DE TIROS LIBRES (por team_id)
      const { data: freeKicks } = await supabase.from("free_kick_goals").select("points").eq("team_id", team.id)
      let totalFreeKickPoints = 0
      if (freeKicks) {
        totalFreeKickPoints = freeKicks.reduce((sum, freeKick) => sum + (freeKick.points || 0), 0)
      }

      console.log(`Puntos de tiros libres para ${team.name}:`, totalFreeKickPoints)

      // 4. SUMAR TODOS LOS PUNTOS Y CALCULAR GOLES
      const finalTotalPoints = totalSalesPoints + totalClientsPoints + totalFreeKickPoints
      const goals = Math.floor(finalTotalPoints / puntosParaGol)

      console.log(`Total puntos para ${team.name}:`, finalTotalPoints, `Goles:`, goals)

      ranking.push({
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        distributor_logo: team.distributors.logo_url,
        goals: goals,
        total_points: finalTotalPoints,
        zone_name: team.zones.name,
      })
    }

    // Ordenar por puntos totales y asignar posiciones
    const sortedRanking = ranking
      .sort((a, b) => b.total_points - a.total_points)
      .map((team, index) => ({
        ...team,
        position: index + 1,
      }))

    return { success: true, data: sortedRanking }
  } catch (error) {
    console.error("Error in getTeamRankingByZone:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getSalesRankingByZone(zoneId?: string) {
  try {
    const supabase = createServerClient()

    // Obtener equipos de la zona
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

    const ranking: SalesRanking[] = []

    for (const team of teams || []) {
      // Obtener miembros del equipo
      const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)

      const memberIds = teamMembers?.map((member) => member.id) || []

      // Obtener ventas del equipo a través de los miembros
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("points")
        .in("representative_id", memberIds.length > 0 ? memberIds : ["no-members"])

      let totalSales = 0
      let totalPoints = 0

      if (!salesError && sales) {
        totalSales = sales.length
        totalPoints = sales.reduce((sum, sale) => sum + (sale.points || 0), 0)
      }

      ranking.push({
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        total_sales: totalSales,
        total_points: totalPoints,
        zone_name: team.zones.name,
      })
    }

    // Ordenar por puntos totales y asignar posiciones
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

    // Obtener equipos de la zona
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

    const ranking: ClientsRanking[] = []

    for (const team of teams || []) {
      // Obtener representantes del equipo
      const { data: representatives, error: repsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("team_id", team.id)

      let totalClients = 0
      const countedClientIds = new Set()

      if (!repsError && representatives && representatives.length > 0) {
        const { data: clients, error: clientsError } = await supabase
          .from("competitor_clients")
          .select("id")
          .in(
            "representative_id",
            representatives.map((rep) => rep.id),
          )

        if (!clientsError && clients) {
          // Contar clientes únicos
          clients.forEach((client) => {
            if (!countedClientIds.has(client.id)) {
              countedClientIds.add(client.id)
              totalClients++
            }
          })
        }
      }

      // También verificar clientes asignados directamente al equipo
      const { data: teamClients, error: teamClientsError } = await supabase
        .from("competitor_clients")
        .select("id")
        .eq("team_id", team.id)

      if (!teamClientsError && teamClients) {
        teamClients.forEach((client) => {
          if (!countedClientIds.has(client.id)) {
            countedClientIds.add(client.id)
            totalClients++
          }
        })
      }

      const totalPointsFromClients = totalClients * 200 // 200 puntos por cliente

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

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
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
        zone_id,
        zones!inner(name)
      `)
      .eq("id", profile.team_id)
      .single()

    if (teamError || !team) {
      return { success: false, error: "Error al obtener información del equipo" }
    }

    // Obtener miembros del equipo
    const { data: teamMembers } = await supabase.from("profiles").select("id").eq("team_id", team.id)

    const memberIds = teamMembers?.map((member) => member.id) || []

    // 1. CALCULAR PUNTOS DE VENTAS - BUSCAR POR AMBOS CAMPOS
    let totalPointsFromSales = 0

    // Buscar ventas por representative_id (miembros del equipo)
    if (memberIds.length > 0) {
      const { data: salesByRep } = await supabase.from("sales").select("points").in("representative_id", memberIds)

      if (salesByRep) {
        totalPointsFromSales += salesByRep.reduce((sum, sale) => sum + (sale.points || 0), 0)
      }
    }

    // Buscar ventas directas por team_id
    const { data: salesByTeam } = await supabase.from("sales").select("points").eq("team_id", team.id)

    if (salesByTeam) {
      totalPointsFromSales += salesByTeam.reduce((sum, sale) => sum + (sale.points || 0), 0)
    }

    // 2. CALCULAR PUNTOS DE CLIENTES
    let totalPointsFromClients = 0
    const countedClientIds = new Set()

    if (memberIds.length > 0) {
      const { data: clients } = await supabase
        .from("competitor_clients")
        .select("id, points")
        .in("representative_id", memberIds)

      if (clients) {
        for (const client of clients) {
          if (!countedClientIds.has(client.id)) {
            totalPointsFromClients += client.points || 200
            countedClientIds.add(client.id)
          }
        }
      }
    }

    // También clientes directos por team_id
    const { data: teamClients } = await supabase.from("competitor_clients").select("id, points").eq("team_id", team.id)

    if (teamClients) {
      for (const client of teamClients) {
        if (!countedClientIds.has(client.id)) {
          totalPointsFromClients += client.points || 200
          countedClientIds.add(client.id)
        }
      }
    }

    // 3. CALCULAR PUNTOS DE TIROS LIBRES
    const { data: freeKicks } = await supabase.from("free_kick_goals").select("points").eq("team_id", team.id)

    let totalPointsFromFreeKicks = 0
    if (freeKicks) {
      totalPointsFromFreeKicks = freeKicks.reduce((sum, freeKick) => sum + (freeKick.points || 0), 0)
    }

    // 4. SUMAR TODOS LOS PUNTOS
    const totalPoints = totalPointsFromSales + totalPointsFromClients + totalPointsFromFreeKicks

    console.log(`Desglose de puntos para ${team.name}:`)
    console.log(`- Ventas: ${totalPointsFromSales}`)
    console.log(`- Clientes: ${totalPointsFromClients}`)
    console.log(`- Tiros libres: ${totalPointsFromFreeKicks}`)
    console.log(`- Total: ${totalPoints}`)

    // Obtener configuración de puntos para gol
    const { data: puntosConfig } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "puntos_para_gol")
      .maybeSingle()

    const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100
    const goals = Math.floor(totalPoints / puntosParaGol)

    // Obtener ranking de la zona para calcular la posición
    const rankingResult = await getTeamRankingByZone(team.zone_id)

    let position = 0
    let goalsToNext = 0

    if (rankingResult.success && rankingResult.data) {
      const teamPosition = rankingResult.data.find((t) => t.team_id === team.id)
      const nextTeam = rankingResult.data.find((t) => t.position === (teamPosition?.position || 1) - 1)

      position = teamPosition?.position || 0
      goalsToNext = nextTeam ? Math.max(0, Math.ceil((nextTeam.total_points - totalPoints) / puntosParaGol)) : 0
    }

    const userTeamInfo: UserTeamInfo = {
      team_id: team.id,
      team_name: team.name,
      zone_id: team.zone_id,
      zone_name: team.zones.name,
      position: position,
      goals: goals,
      total_points: totalPoints,
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
