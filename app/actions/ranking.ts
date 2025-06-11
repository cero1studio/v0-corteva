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

// Función de utilidad para reintento con backoff exponencial
async function fetchWithRetry<T>(fetchFn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let retries = 0

  while (true) {
    try {
      return await fetchFn()
    } catch (error: any) {
      if (retries >= maxRetries || !error.message?.includes("Too Many R")) {
        throw error
      }

      const delay = initialDelay * Math.pow(2, retries)
      console.log(`Retry ${retries + 1}/${maxRetries} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      retries++
    }
  }
}

// Función para dividir un array en chunks para evitar consultas demasiado grandes
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export async function getTeamRankingByZone(zoneId?: string) {
  try {
    const supabase = createServerClient()

    // Obtener configuración de puntos para gol
    const { data: puntosConfig } = await fetchWithRetry(() =>
      supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
    )

    const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100
    console.log("DEBUG: Puntos para gol:", puntosParaGol)

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

    const { data: teams, error: teamsError } = await fetchWithRetry(() => teamsQuery)

    if (teamsError) {
      console.error("Error fetching teams for ranking:", teamsError)
      return { success: false, error: teamsError.message }
    }

    // Si no hay equipos, devolver array vacío
    if (!teams || teams.length === 0) {
      console.log("DEBUG: No teams found for ranking.")
      return { success: true, data: [] }
    }
    console.log(
      "DEBUG: Fetched teams:",
      teams.map((t) => ({ id: t.id, name: t.name, zone: t.zones.name })),
    )

    // Obtener todos los IDs de equipos para hacer consultas batch
    const teamIds = teams.map((team) => team.id)

    // Crear un mapa para almacenar los puntos por equipo
    const teamPointsMap = new Map<
      string,
      {
        salesPoints: number
        clientsPoints: number
        freeKickPoints: number
        totalPoints: number
        goals: number
      }
    >()

    // Inicializar el mapa con todos los equipos
    for (const team of teams) {
      teamPointsMap.set(team.id, {
        salesPoints: 0,
        clientsPoints: 0,
        freeKickPoints: 0,
        totalPoints: 0,
        goals: 0,
      })
    }

    // Obtener miembros de equipos en chunks para evitar consultas demasiado grandes
    const CHUNK_SIZE = 10 // Ajustar según sea necesario
    const teamChunks = chunkArray(teamIds, CHUNK_SIZE)

    const allMemberIds: string[] = []
    const teamMemberMap = new Map<string, string[]>()

    // Procesar cada chunk de equipos
    for (const chunk of teamChunks) {
      const { data: members } = await fetchWithRetry(() =>
        supabase.from("profiles").select("id, team_id").in("team_id", chunk),
      )

      if (members && members.length > 0) {
        for (const member of members) {
          if (!teamMemberMap.has(member.team_id)) {
            teamMemberMap.set(member.team_id, [])
          }
          teamMemberMap.get(member.team_id)!.push(member.id)
          allMemberIds.push(member.id)
        }
      }

      // Pequeña pausa para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    console.log("DEBUG: Team member map:", teamMemberMap)

    // Procesar ventas por equipo directamente
    for (const chunk of teamChunks) {
      const { data: salesByTeam } = await fetchWithRetry(() =>
        supabase.from("sales").select("points, team_id").in("team_id", chunk),
      )

      if (salesByTeam && salesByTeam.length > 0) {
        for (const sale of salesByTeam) {
          if (sale.team_id && teamPointsMap.has(sale.team_id)) {
            const teamData = teamPointsMap.get(sale.team_id)!
            teamData.salesPoints += sale.points || 0
            teamPointsMap.set(sale.team_id, teamData)
          }
        }
      }

      // Pequeña pausa para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Procesar clientes por equipo directamente
    for (const chunk of teamChunks) {
      const { data: clientsByTeam } = await fetchWithRetry(() =>
        supabase.from("competitor_clients").select("id, points, team_id").in("team_id", chunk),
      )

      if (clientsByTeam && clientsByTeam.length > 0) {
        const processedClientIds = new Set<string>()

        for (const client of clientsByTeam) {
          if (client.team_id && teamPointsMap.has(client.team_id) && !processedClientIds.has(client.id)) {
            const teamData = teamPointsMap.get(client.team_id)!
            teamData.clientsPoints += client.points || 200
            teamPointsMap.set(client.team_id, teamData)
            processedClientIds.add(client.id)
          }
        }
      }

      // Pequeña pausa para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Procesar tiros libres por equipo
    for (const chunk of teamChunks) {
      const { data: freeKicksByTeam } = await fetchWithRetry(() =>
        supabase.from("free_kick_goals").select("points, team_id").in("team_id", chunk),
      )

      if (freeKicksByTeam && freeKicksByTeam.length > 0) {
        for (const freeKick of freeKicksByTeam) {
          if (freeKick.team_id && teamPointsMap.has(freeKick.team_id)) {
            const teamData = teamPointsMap.get(freeKick.team_id)!
            teamData.freeKickPoints += freeKick.points || 0
            teamPointsMap.set(freeKick.team_id, teamData)
          }
        }
      }

      // Pequeña pausa para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Procesar ventas por representante
    if (allMemberIds.length > 0) {
      const memberChunks = chunkArray(allMemberIds, CHUNK_SIZE)

      for (const chunk of memberChunks) {
        const { data: salesByRep } = await fetchWithRetry(() =>
          supabase.from("sales").select("points, representative_id").in("representative_id", chunk),
        )

        if (salesByRep && salesByRep.length > 0) {
          for (const sale of salesByRep) {
            if (sale.representative_id) {
              // Encontrar a qué equipo pertenece este representante
              for (const [teamId, memberIds] of teamMemberMap.entries()) {
                if (memberIds.includes(sale.representative_id) && teamPointsMap.has(teamId)) {
                  const teamData = teamPointsMap.get(teamId)!
                  teamData.salesPoints += sale.points || 0
                  teamPointsMap.set(teamId, teamData)
                  break
                }
              }
            }
          }
        }

        // Pequeña pausa para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Procesar clientes por representante
      const processedClientIds = new Set<string>()

      for (const chunk of memberChunks) {
        const { data: clientsByRep } = await fetchWithRetry(() =>
          supabase.from("competitor_clients").select("id, points, representative_id").in("representative_id", chunk),
        )

        if (clientsByRep && clientsByRep.length > 0) {
          for (const client of clientsByRep) {
            if (client.representative_id && !processedClientIds.has(client.id)) {
              // Encontrar a qué equipo pertenece este representante
              for (const [teamId, memberIds] of teamMemberMap.entries()) {
                if (memberIds.includes(client.representative_id) && teamPointsMap.has(teamId)) {
                  const teamData = teamPointsMap.get(teamId)!
                  teamData.clientsPoints += client.points || 200
                  teamPointsMap.set(teamId, teamData)
                  processedClientIds.add(client.id)
                  break
                }
              }
            }
          }
        }

        // Pequeña pausa para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Calcular puntos totales y goles para cada equipo
    for (const [teamId, teamData] of teamPointsMap.entries()) {
      const totalPoints = teamData.salesPoints + teamData.clientsPoints + teamData.freeKickPoints
      const goals = Math.floor(totalPoints / puntosParaGol)

      console.log(
        `DEBUG: Team ${teams.find((t) => t.id === teamId)?.name || teamId} - Sales Points: ${teamData.salesPoints}, Clients Points: ${teamData.clientsPoints}, Free Kick Points: ${teamData.freeKickPoints}, Total Points: ${totalPoints}, Calculated Goals: ${goals}`,
      )

      teamPointsMap.set(teamId, {
        ...teamData,
        totalPoints,
        goals,
      })
    }

    // Crear el ranking final
    const ranking: TeamRanking[] = teams.map((team) => {
      const teamData = teamPointsMap.get(team.id) || {
        salesPoints: 0,
        clientsPoints: 0,
        freeKickPoints: 0,
        totalPoints: 0,
        goals: 0,
      }

      return {
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        distributor_logo: team.distributors.logo_url,
        goals: teamData.goals,
        total_points: teamData.totalPoints,
        zone_name: team.zones.name,
      }
    })

    // Ordenar por puntos totales y asignar posiciones
    const sortedRanking = ranking
      .sort((a, b) => b.total_points - a.total_points)
      .map((team, index) => ({
        ...team,
        position: index + 1,
      }))

    console.log("DEBUG: Final sorted ranking data (from action):", sortedRanking)
    return { success: true, data: sortedRanking }
  } catch (error) {
    console.error("Error in getTeamRankingByZone:", error)
    return {
      success: false,
      error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)),
    }
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

    const { data: teams, error: teamsError } = await fetchWithRetry(() => teamsQuery)

    if (teamsError) {
      console.error("Error fetching teams for sales ranking:", teamsError)
      return { success: false, error: teamsError.message }
    }

    // Si no hay equipos, devolver array vacío
    if (!teams || teams.length === 0) {
      return { success: true, data: [] }
    }

    const teamIds = teams.map((team) => team.id)
    const teamChunks = chunkArray(teamIds, 10)

    // Mapa para almacenar datos de ventas por equipo
    const salesByTeamMap = new Map<
      string,
      {
        totalSales: number
        totalPoints: number
      }
    >()

    // Inicializar el mapa con todos los equipos
    for (const team of teams) {
      salesByTeamMap.set(team.id, {
        totalSales: 0,
        totalPoints: 0,
      })
    }

    // Obtener miembros de equipos en chunks
    const teamMemberMap = new Map<string, string[]>()

    for (const chunk of teamChunks) {
      const { data: members } = await fetchWithRetry(() =>
        supabase.from("profiles").select("id, team_id").in("team_id", chunk),
      )

      if (members && members.length > 0) {
        for (const member of members) {
          if (!teamMemberMap.has(member.team_id)) {
            teamMemberMap.set(member.team_id, [])
          }
          teamMemberMap.get(member.team_id)!.push(member.id)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Procesar ventas por equipo y por representante
    for (const [teamId, memberIds] of teamMemberMap.entries()) {
      if (memberIds.length > 0) {
        const memberChunks = chunkArray(memberIds, 10)

        for (const chunk of memberChunks) {
          const { data: sales } = await fetchWithRetry(() =>
            supabase.from("sales").select("points").in("representative_id", chunk),
          )

          if (sales && sales.length > 0) {
            const teamData = salesByTeamMap.get(teamId)!
            teamData.totalSales += sales.length
            teamData.totalPoints += sales.reduce((sum, sale) => sum + (sale.points || 0), 0)
            salesByTeamMap.set(teamId, teamData)
          }

          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // También buscar ventas directas por team_id
      const { data: directSales } = await fetchWithRetry(() =>
        supabase.from("sales").select("points").eq("team_id", teamId),
      )

      if (directSales && directSales.length > 0) {
        const teamData = salesByTeamMap.get(teamId)!
        teamData.totalSales += directSales.length
        teamData.totalPoints += directSales.reduce((sum, sale) => sum + (sale.points || 0), 0)
        salesByTeamMap.set(teamId, teamData)
      }
    }

    // Crear el ranking final
    const ranking: SalesRanking[] = teams.map((team) => {
      const teamData = salesByTeamMap.get(team.id) || {
        totalSales: 0,
        totalPoints: 0,
      }

      return {
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        total_sales: teamData.totalSales,
        total_points: teamData.totalPoints,
        zone_name: team.zones.name,
      }
    })

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
    return {
      success: false,
      error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)),
    }
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

    const { data: teams, error: teamsError } = await fetchWithRetry(() => teamsQuery)

    if (teamsError) {
      console.error("Error fetching teams for clients ranking:", teamsError)
      return { success: false, error: teamsError.message }
    }

    // Si no hay equipos, devolver array vacío
    if (!teams || teams.length === 0) {
      return { success: true, data: [] }
    }

    const teamIds = teams.map((team) => team.id)
    const teamChunks = chunkArray(teamIds, 10)

    // Mapa para almacenar datos de clientes por equipo
    const clientsByTeamMap = new Map<
      string,
      {
        totalClients: number
        totalPoints: number
      }
    >()

    // Conjunto para rastrear clientes ya contados
    const countedClientIds = new Set<string>()

    // Inicializar el mapa con todos los equipos
    for (const team of teams) {
      clientsByTeamMap.set(team.id, {
        totalClients: 0,
        totalPoints: 0,
      })
    }

    // Obtener miembros de equipos en chunks
    const teamMemberMap = new Map<string, string[]>()

    for (const chunk of teamChunks) {
      const { data: members } = await fetchWithRetry(() =>
        supabase.from("profiles").select("id, team_id").in("team_id", chunk),
      )

      if (members && members.length > 0) {
        for (const member of members) {
          if (!teamMemberMap.has(member.team_id)) {
            teamMemberMap.set(member.team_id, [])
          }
          teamMemberMap.get(member.team_id)!.push(member.id)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Procesar clientes por equipo directamente
    for (const chunk of teamChunks) {
      const { data: clients } = await fetchWithRetry(() =>
        supabase.from("competitor_clients").select("id, points, team_id").in("team_id", chunk),
      )

      if (clients && clients.length > 0) {
        for (const client of clients) {
          if (client.team_id && !countedClientIds.has(client.id)) {
            const teamData = clientsByTeamMap.get(client.team_id)!
            teamData.totalClients += 1
            teamData.totalPoints += client.points || 200
            clientsByTeamMap.set(client.team_id, teamData)
            countedClientIds.add(client.id)
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Procesar clientes por representante
    for (const [teamId, memberIds] of teamMemberMap.entries()) {
      if (memberIds.length > 0) {
        const memberChunks = chunkArray(memberIds, 10)

        for (const chunk of memberChunks) {
          const { data: clients } = await fetchWithRetry(() =>
            supabase.from("competitor_clients").select("id, points, representative_id").in("representative_id", chunk),
          )

          if (clients && clients.length > 0) {
            for (const client of clients) {
              if (!countedClientIds.has(client.id)) {
                const teamData = clientsByTeamMap.get(teamId)!
                teamData.totalClients += 1
                teamData.totalPoints += client.points || 200
                clientsByTeamMap.set(teamId, teamData)
                countedClientIds.add(client.id)
              }
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    }

    // Crear el ranking final
    const ranking: ClientsRanking[] = teams.map((team) => {
      const teamData = clientsByTeamMap.get(team.id) || {
        totalClients: 0,
        totalPoints: 0,
      }

      return {
        position: 0, // Se asignará después del ordenamiento
        team_id: team.id,
        team_name: team.name,
        distributor_name: team.distributors.name,
        total_clients: teamData.totalClients,
        total_points_from_clients: teamData.totalPoints,
        zone_name: team.zones.name,
      }
    })

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
    return {
      success: false,
      error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function getUserTeamInfo(
  userId: string,
): Promise<{ success: boolean; data?: UserTeamInfo; error?: string }> {
  try {
    const supabase = createServerClient()

    console.log("Buscando usuario con ID:", userId)

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await fetchWithRetry(() =>
      supabase.from("profiles").select("*").eq("id", userId).single(),
    )

    if (profileError || !profile) {
      return { success: false, error: "Usuario no encontrado en profiles" }
    }

    if (!profile.team_id) {
      return { success: false, error: "Usuario no tiene equipo asignado" }
    }

    // Obtener información del equipo
    const { data: team, error: teamError } = await fetchWithRetry(() =>
      supabase
        .from("teams")
        .select(`
          id,
          name,
          zone_id,
          zones!inner(name)
        `)
        .eq("id", profile.team_id)
        .single(),
    )

    if (teamError || !team) {
      return { success: false, error: "Error al obtener información del equipo" }
    }

    // Obtener miembros del equipo
    const { data: teamMembers } = await fetchWithRetry(() =>
      supabase.from("profiles").select("id").eq("team_id", team.id),
    )

    const memberIds = teamMembers?.map((member) => member.id) || []

    // 1. CALCULAR PUNTOS DE VENTAS - BUSCAR POR AMBOS CAMPOS
    let totalPointsFromSales = 0

    // Buscar ventas por representative_id (miembros del equipo)
    if (memberIds.length > 0) {
      const memberChunks = chunkArray(memberIds, 10)

      for (const chunk of memberChunks) {
        const { data: salesByRep } = await fetchWithRetry(() =>
          supabase.from("sales").select("points").in("representative_id", chunk),
        )

        if (salesByRep) {
          totalPointsFromSales += salesByRep.reduce((sum, sale) => sum + (sale.points || 0), 0)
        }

        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Buscar ventas directas por team_id
    const { data: salesByTeam } = await fetchWithRetry(() =>
      supabase.from("sales").select("points").eq("team_id", team.id),
    )

    if (salesByTeam) {
      totalPointsFromSales += salesByTeam.reduce((sum, sale) => sum + (sale.points || 0), 0)
    }

    // 2. CALCULAR PUNTOS DE CLIENTES
    let totalPointsFromClients = 0
    const countedClientIds = new Set()

    if (memberIds.length > 0) {
      const memberChunks = chunkArray(memberIds, 10)

      for (const chunk of memberChunks) {
        const { data: clients } = await fetchWithRetry(() =>
          supabase.from("competitor_clients").select("id, points").in("representative_id", chunk),
        )

        if (clients) {
          for (const client of clients) {
            if (!countedClientIds.has(client.id)) {
              totalPointsFromClients += client.points || 200
              countedClientIds.add(client.id)
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // También clientes directos por team_id
    const { data: teamClients } = await fetchWithRetry(() =>
      supabase.from("competitor_clients").select("id, points").eq("team_id", team.id),
    )

    if (teamClients) {
      for (const client of teamClients) {
        if (!countedClientIds.has(client.id)) {
          totalPointsFromClients += client.points || 200
          countedClientIds.add(client.id)
        }
      }
    }

    // 3. CALCULAR PUNTOS DE TIROS LIBRES
    const { data: freeKicks } = await fetchWithRetry(() =>
      supabase.from("free_kick_goals").select("points").eq("team_id", team.id),
    )

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
    const { data: puntosConfig } = await fetchWithRetry(() =>
      supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
    )

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
    return {
      success: false,
      error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function getProducts() {
  try {
    const supabase = createServerClient()

    const { data: products, error } = await fetchWithRetry(() =>
      supabase.from("products").select("id, name").eq("active", true).order("name"),
    )

    if (error) {
      console.error("Error fetching products:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: products || [] }
  } catch (error) {
    console.error("Error in getProducts:", error)
    return {
      success: false,
      error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}
