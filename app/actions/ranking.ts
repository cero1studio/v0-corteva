"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

// Obtener ranking general de equipos
export async function getTeamRanking(limit = 10) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.rpc("get_team_ranking", { limit_count: limit })

    if (error) throw new Error(`Error al obtener ranking: ${error.message}`)

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getTeamRanking:", error)
    return { success: false, error: error.message }
  }
}

// Obtener ranking por zona
export async function getZoneRanking(zoneId: string, limit = 10) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.rpc("get_zone_ranking", { zone_id_param: zoneId, limit_count: limit })

    if (error) throw new Error(`Error al obtener ranking por zona: ${error.message}`)

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getZoneRanking:", error)
    return { success: false, error: error.message }
  }
}

// Obtener ranking de distribuidores
export async function getDistributorRanking() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.rpc("get_distributor_ranking")

    if (error) throw new Error(`Error al obtener ranking de distribuidores: ${error.message}`)

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getDistributorRanking:", error)
    return { success: false, error: error.message }
  }
}

// Obtener ranking de zonas
export async function getZonesRanking() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.rpc("get_zones_ranking")

    if (error) throw new Error(`Error al obtener ranking de zonas: ${error.message}`)

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getZonesRanking:", error)
    return { success: false, error: error.message }
  }
}

// Obtener posición de un equipo en el ranking
export async function getTeamPosition(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Primero obtenemos el ranking completo
    const { data: rankingData, error: rankingError } = await supabase.rpc("get_team_ranking", { limit_count: 1000 })

    if (rankingError) throw new Error(`Error al obtener ranking: ${rankingError.message}`)

    // Buscamos la posición del equipo en el ranking
    const teamPosition = rankingData.findIndex((team: any) => team.id === teamId) + 1

    if (teamPosition === 0) {
      // El equipo no está en el ranking
      return {
        success: true,
        data: {
          position: null,
          total_teams: rankingData.length,
        },
      }
    }

    return {
      success: true,
      data: {
        position: teamPosition,
        total_teams: rankingData.length,
      },
    }
  } catch (error: any) {
    console.error("Error en getTeamPosition:", error)
    return { success: false, error: error.message }
  }
}
