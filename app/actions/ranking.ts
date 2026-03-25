"use server"

import { rankingCache } from "@/lib/ranking-cache"
import { createServerClient } from "@/lib/supabase/server"

export interface TeamRanking {
  position: number
  team_id: string
  team_name: string
  distributor_name: string
  distributor_logo?: string
  captain_name?: string
  captain_id?: string
  goals: number
  total_points: number
  zone_name: string
  /** Puntos de ventas (solo ventas). */
  total_sales_points?: number
  /** Puntos de clientes competencia. */
  total_clients_points?: number
  /** Puntos de tiros libres (premio aparte; no suman al ranking oficial). */
  free_kick_points?: number
}

export interface FreeKicksRankingItem {
  position: number
  team_id: string
  team_name: string
  distributor_name: string
  zone_name: string
  captain_name?: string
  free_kick_points: number
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
  /** Puntos oficiales (ventas + clientes); definen posición y goles del concurso. */
  total_points: number
  goals_to_next_position: number
  /** Puntos de tiros libres; no cuentan para total_points ni goles oficiales. */
  free_kick_points: number
  /** Posición en el ranking de premio tiros libres de la zona (1 = primero). */
  free_kicks_position: number
}

export async function getTeamRankingByZone(zoneId?: string) {
  try {
    // Intentar obtener del cache primero
    const cacheKey = zoneId || "all"
    const cachedData = rankingCache.get(cacheKey)
    if (cachedData) {
      console.log("DEBUG: Returning cached ranking data")
      return { success: true, data: cachedData }
    }

    // Si no está en cache, continuar con la lógica existente...
    const supabase = createServerClient()

    const { data: puntosRow } = await supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle()
    const puntosParaGol = puntosRow?.value ? Number(puntosRow.value) : 100

    // Obtener equipos con sus zonas y distribuidores (sin capitanes por ahora)
    let teamsQuery = supabase.from("teams").select(`
  id,
  name,
  zone_id,
  zones!left(id, name),
  distributors!left(id, name, logo_url)
`)

    if (zoneId) {
      teamsQuery = teamsQuery.eq("zone_id", zoneId)
    }

    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error("Error fetching teams for ranking:", teamsError)
      return { success: false, error: teamsError.message }
    }
    console.log("DEBUG: Teams fetched (raw):", teams?.length, teams?.[0]) // Log de depuración

    // Obtener todos los IDs de equipos para hacer consultas batch
    const teamIds = teams?.map((team) => team.id) || []

    // Obtener capitanes de todos los equipos
    const captainsMap = new Map<string, { id: string; name: string }>()
    if (teamIds.length > 0) {
      const { data: captains } = await supabase
        .from("profiles")
        .select("id, full_name, team_id")
        .in("team_id", teamIds)
        .eq("role", "capitan")

      if (captains) {
        captains.forEach((captain) => {
          if (captain.team_id) {
            captainsMap.set(captain.team_id, {
              id: captain.id,
              name: captain.full_name || "Sin nombre",
            })
          }
        })
      }
    }

    const allMemberIds: string[] = []
    const teamMemberMap = new Map<string, string[]>()

    // Obtener todos los miembros de todos los equipos en una sola consulta
    if (teamIds.length > 0) {
      const { data: allMembers } = await supabase.from("profiles").select("id, team_id").in("team_id", teamIds)

      if (allMembers) {
        allMembers.forEach((member) => {
          if (member.team_id) {
            // Asegurar que team_id no sea null
            if (!teamMemberMap.has(member.team_id)) {
              teamMemberMap.set(member.team_id, [])
            }
            teamMemberMap.get(member.team_id)!.push(member.id)
            allMemberIds.push(member.id)
          }
        })
      }
    }
    console.log("DEBUG: All member IDs:", allMemberIds.length) // Log de depuración

    // Obtener todas las ventas, clientes y tiros libres en consultas batch
    const [salesByRep, salesByTeam, clientsByRep, clientsByTeam, allFreeKicks] = await Promise.allSettled([
      // Ventas por representante
      allMemberIds.length > 0
        ? supabase.from("sales").select("points, representative_id").in("representative_id", allMemberIds)
        : Promise.resolve({ data: [], error: null }),

      // Ventas por equipo
      teamIds.length > 0
        ? supabase.from("sales").select("points, team_id").in("team_id", teamIds)
        : Promise.resolve({ data: [], error: null }),

      // Clientes por representante
      allMemberIds.length > 0
        ? supabase
            .from("competitor_clients")
            .select("id, points, representative_id")
            .in("representative_id", allMemberIds)
        : Promise.resolve({ data: [], error: null }),

      // Clientes por equipo
      teamIds.length > 0
        ? supabase.from("competitor_clients").select("id, points, team_id").in("team_id", teamIds)
        : Promise.resolve({ data: [], error: null }),

      // Tiros libres
      teamIds.length > 0
        ? supabase.from("free_kick_goals").select("points, team_id").in("team_id", teamIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    // Procesar resultados y manejar errores
    const salesRepData = salesByRep.status === "fulfilled" ? salesByRep.value.data || [] : []
    const salesTeamData = salesByTeam.status === "fulfilled" ? salesByTeam.value.data || [] : []
    const clientsRepData = clientsByRep.status === "fulfilled" ? clientsByRep.value.data || [] : []
    const clientsTeamData = clientsByTeam.status === "fulfilled" ? clientsByTeam.value.data || [] : []
    const freeKicksData = allFreeKicks.status === "fulfilled" ? allFreeKicks.value.data || [] : []

    console.log("DEBUG: Sales Rep Data:", salesRepData.length)
    console.log("DEBUG: Sales Team Data:", salesTeamData.length)
    console.log("DEBUG: Clients Rep Data:", clientsRepData.length)
    console.log("DEBUG: Free Kicks Data:", freeKicksData.length)

    // Crear mapas para acceso rápido
    const salesByRepMap = new Map<string, number>()
    salesRepData.forEach((sale) => {
      if (sale.representative_id) {
        salesByRepMap.set(sale.representative_id, (salesByRepMap.get(sale.representative_id) || 0) + (sale.points || 0))
      }
    })

    const salesByTeamMap = new Map<string, number>()
    salesTeamData.forEach((sale) => {
      if (sale.team_id) {
        salesByTeamMap.set(sale.team_id, (salesByTeamMap.get(sale.team_id) || 0) + (sale.points || 0))
      }
    })

    const clientsByRepMap = new Map<string, Set<string>>() // Usar Set para IDs de clientes únicos
    clientsRepData.forEach((client) => {
      if (client.representative_id) {
        if (!clientsByRepMap.has(client.representative_id)) {
          clientsByRepMap.set(client.representative_id, new Set())
        }
        clientsByRepMap.get(client.representative_id)!.add(client.id)
      }
    })

    const clientsByTeamMap = new Map<string, Set<string>>() // Usar Set para IDs de clientes únicos
    clientsTeamData.forEach((client) => {
      if (client.team_id) {
        if (!clientsByTeamMap.has(client.team_id)) {
          clientsByTeamMap.set(client.team_id, new Set())
        }
        clientsByTeamMap.get(client.team_id)!.add(client.id)
      }
    })

    const freeKicksByTeamMap = new Map<string, number>()
    freeKicksData.forEach((freeKick) => {
      if (freeKick.team_id) {
        freeKicksByTeamMap.set(
          freeKick.team_id,
          (freeKicksByTeamMap.get(freeKick.team_id) || 0) + (freeKick.points || 0),
        )
      }
    })

    // Calcular puntos para cada equipo
    const ranking: TeamRanking[] = []

    for (const team of teams || []) {
      console.log(`DEBUG: Calculando puntos para equipo: ${team.name} (ID: ${team.id})`)

      const memberIds = teamMemberMap.get(team.id) || []
      console.log(`DEBUG: Team ${team.name} - Member IDs:`, memberIds)

      // 1. CALCULAR PUNTOS DE VENTAS
      let totalSalesPoints = 0

      // Sumar ventas por representantes del equipo
      memberIds.forEach((memberId) => {
        const points = salesByRepMap.get(memberId) || 0
        totalSalesPoints += points
        console.log(`DEBUG: Team ${team.name} - Sales points from rep ${memberId}:`, points)
      })

      // Sumar ventas directas por team_id
      const directTeamSalesPoints = salesByTeamMap.get(team.id) || 0
      totalSalesPoints += directTeamSalesPoints
      console.log(`DEBUG: Team ${team.name} - Sales points from team direct:`, directTeamSalesPoints)
      console.log(`DEBUG: Team ${team.name} - Total Sales Points:`, totalSalesPoints)

      // 2. CALCULAR PUNTOS DE CLIENTES
      let totalClientsPoints = 0
      const teamClientUniqueIds = new Set<string>() // Para asegurar unicidad de clientes por equipo

      // Clientes por representantes
      memberIds.forEach((memberId) => {
        const clientIds = clientsByRepMap.get(memberId)
        if (clientIds) {
          clientIds.forEach((clientId) => {
            if (!teamClientUniqueIds.has(clientId)) {
              totalClientsPoints += 200 // Puntos por cliente
              teamClientUniqueIds.add(clientId)
            }
          })
        }
      })

      // Clientes directos por equipo
      const directTeamClientIds = clientsByTeamMap.get(team.id)
      if (directTeamClientIds) {
        directTeamClientIds.forEach((clientId) => {
          if (!teamClientUniqueIds.has(clientId)) {
            totalClientsPoints += 200
            teamClientUniqueIds.add(clientId)
          }
        })
      }
      console.log(`DEBUG: Team ${team.name} - Total Clients Points:`, totalClientsPoints)

      // 3. CALCULAR PUNTOS DE TIROS LIBRES
      const totalFreeKickPoints = freeKicksByTeamMap.get(team.id) || 0
      console.log(`DEBUG: Team ${team.name} - Total Free Kick Points:`, totalFreeKickPoints)

      // 4. Ranking oficial: solo ventas + clientes (tiros libres aparte)
      const pointsForGoals = totalSalesPoints + totalClientsPoints
      const finalTotalPoints = pointsForGoals
      const goals = Math.floor(pointsForGoals / puntosParaGol)

      console.log(
        `DEBUG: Team ${team.name} - Points for goals: ${pointsForGoals}, Goals: ${goals}, Free kicks (apart): ${totalFreeKickPoints}`,
      )

      const captainInfo = captainsMap.get(team.id)

      ranking.push({
        position: 0,
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors?.name || "Sin distribuidor",
        distributor_logo: team.distributors?.logo_url || null,
        captain_name: captainInfo?.name || "Sin capitán",
        captain_id: captainInfo?.id || null,
        goals,
        total_points: finalTotalPoints,
        zone_name: team.zones?.name || "Sin zona",
        total_sales_points: totalSalesPoints,
        total_clients_points: totalClientsPoints,
        free_kick_points: totalFreeKickPoints,
      })
    }

    const sortedRanking = ranking
      .sort((a, b) => b.total_points - a.total_points)
      .map((team, index) => ({
        ...team,
        position: index + 1,
      }))

    // Guardar en cache antes de retornar
    rankingCache.set(cacheKey, sortedRanking)

    console.log("DEBUG: Final sorted ranking data:", sortedRanking)
    return { success: true, data: sortedRanking }
  } catch (error) {
    console.error("Error in getTeamRankingByZone:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getFreeKicksRankingByZone(
  zoneId?: string,
): Promise<{ success: boolean; data?: FreeKicksRankingItem[]; error?: string }> {
  try {
    const supabase = createServerClient()

    let teamsQuery = supabase.from("teams").select(`
      id,
      name,
      zone_id,
      zones!left(id, name),
      distributors!left(id, name)
    `)
    if (zoneId) {
      teamsQuery = teamsQuery.eq("zone_id", zoneId)
    }
    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError || !teams?.length) {
      return { success: true, data: [] }
    }

    const teamIds = teams.map((t) => t.id)
    const { data: freeKicksData } = await supabase
      .from("free_kick_goals")
      .select("points, team_id")
      .in("team_id", teamIds)

    const freeKicksByTeam = new Map<string, number>()
    freeKicksData?.forEach((fk) => {
      if (fk.team_id) {
        freeKicksByTeam.set(fk.team_id, (freeKicksByTeam.get(fk.team_id) || 0) + (fk.points || 0))
      }
    })

    const { data: captains } = await supabase
      .from("profiles")
      .select("id, full_name, team_id")
      .eq("role", "capitan")
      .in("team_id", teamIds)

    const captainByTeam = new Map<string, { name: string }>()
    captains?.forEach((c) => {
      if (c.team_id) {
        captainByTeam.set(c.team_id, { name: c.full_name || "Sin capitán" })
      }
    })

    const ranking: FreeKicksRankingItem[] = teams.map((team) => ({
      position: 0,
      team_id: team.id,
      team_name: team.name,
      distributor_name: team.distributors?.name || "Sin distribuidor",
      zone_name: team.zones?.name || "Sin zona",
      captain_name: captainByTeam.get(team.id)?.name,
      free_kick_points: freeKicksByTeam.get(team.id) || 0,
    }))

    const sorted = ranking
      .sort((a, b) => b.free_kick_points - a.free_kick_points)
      .map((item, index) => ({ ...item, position: index + 1 }))

    return { success: true, data: sorted }
  } catch (error) {
    console.error("Error in getFreeKicksRankingByZone:", error)
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
        zones!left(id, name),
        distributors!left(id, name, logo_url)
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

      // Obtener ventas del equipo a través de los miembros y ventas directas del equipo
      const [salesByRepResult, salesByTeamResult] = await Promise.allSettled([
        memberIds.length > 0
          ? supabase.from("sales").select("points").in("representative_id", memberIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("sales").select("points").eq("team_id", team.id),
      ])

      const salesByRep = salesByRepResult.status === "fulfilled" ? salesByRepResult.value.data || [] : []
      const salesByTeam = salesByTeamResult.status === "fulfilled" ? salesByTeamResult.value.data || [] : []

      let totalSales = 0
      let totalPoints = 0

      totalSales += salesByRep.length
      totalPoints += salesByRep.reduce((sum, sale) => sum + (sale.points || 0), 0)

      totalSales += salesByTeam.length
      totalPoints += salesByTeam.reduce((sum, sale) => sum + (sale.points || 0), 0)

      ranking.push({
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors?.name || "Sin distribuidor",
        total_sales: totalSales,
        total_points: totalPoints,
        zone_name: team.zones?.name || "Sin zona",
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
        zones!left(id, name),
        distributors!left(id, name, logo_url)
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
        distributor_name: team.distributors?.name || "Sin distribuidor",
        total_clients: totalClients,
        total_points_from_clients: totalPointsFromClients,
        zone_name: team.zones?.name || "Sin zona",
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
        zones!left(name)
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

    const pointsForGoals = totalPointsFromSales + totalPointsFromClients

    const { data: puntosRow } = await supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle()
    const puntosParaGol = puntosRow?.value ? Number(puntosRow.value) : 100
    const goals = Math.floor(pointsForGoals / puntosParaGol)

    const [rankingResult, fkRankingResult] = await Promise.all([
      getTeamRankingByZone(team.zone_id),
      getFreeKicksRankingByZone(team.zone_id),
    ])

    let position = 0
    let goalsToNext = 0

    if (rankingResult.success && rankingResult.data) {
      const teamPosition = rankingResult.data.find((t) => t.team_id === team.id)
      const nextTeam = rankingResult.data.find((t) => t.position === (teamPosition?.position || 1) - 1)

      position = teamPosition?.position || 0
      const myPointsForRanking = teamPosition?.total_points ?? pointsForGoals
      const nextPoints = nextTeam?.total_points ?? 0
      goalsToNext = nextTeam ? Math.max(0, Math.ceil((nextPoints - myPointsForRanking) / puntosParaGol)) : 0
    }

    let freeKicksPosition = 0
    if (fkRankingResult.success && fkRankingResult.data) {
      const row = fkRankingResult.data.find((t) => t.team_id === team.id)
      freeKicksPosition = row?.position ?? 0
    }

    const userTeamInfo: UserTeamInfo = {
      team_id: team.id,
      team_name: team.name,
      zone_id: team.zone_id,
      zone_name: team.zones?.name || "Sin zona",
      position,
      goals,
      total_points: pointsForGoals,
      goals_to_next_position: goalsToNext,
      free_kick_points: totalPointsFromFreeKicks,
      free_kicks_position: freeKicksPosition,
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
