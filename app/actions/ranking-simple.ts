"use server"

import { createServerClient } from "@/lib/supabase/server"

export interface SimpleTeamRanking {
  id: string
  name: string
  distributor_name: string
  zone_name: string
  total_points: number
  goals: number
  position: number
}

export async function getSimpleRanking(zoneId?: string) {
  try {
    console.log("getSimpleRanking: Iniciando con zoneId:", zoneId)
    const supabase = createServerClient()

    // Obtener configuración de puntos para gol
    const { data: config } = await supabase.from("system_config").select("value").eq("key", "puntos_para_gol").single()

    const puntosParaGol = config?.value ? Number(config.value) : 100
    console.log("getSimpleRanking: Puntos para gol:", puntosParaGol)

    // Query base para equipos
    let query = supabase
      .from("teams")
      .select(`
        id,
        name,
        total_points,
        distributors!left(name),
        zones!left(name)
      `)
      .order("total_points", { ascending: false })

    if (zoneId) {
      query = query.eq("zone_id", zoneId)
    }

    const { data: teams, error } = await query

    if (error) {
      console.error("getSimpleRanking: Error al obtener equipos:", error)
      return { success: false, error: error.message }
    }

    console.log("getSimpleRanking: Equipos obtenidos:", teams?.length || 0)

    // Procesar resultados
    const ranking: SimpleTeamRanking[] = (teams || []).map((team, index) => ({
      id: team.id,
      name: team.name,
      distributor_name: team.distributors?.name || "Sin distribuidor",
      zone_name: team.zones?.name || "Sin zona",
      total_points: team.total_points || 0,
      goals: Math.floor((team.total_points || 0) / puntosParaGol),
      position: index + 1,
    }))

    console.log("getSimpleRanking: Ranking procesado exitosamente")
    return { success: true, data: ranking }
  } catch (error: any) {
    console.error("getSimpleRanking: Error general:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getUserZone(userId: string) {
  try {
    console.log("getUserZone: Obteniendo zona para usuario:", userId)
    const supabase = createServerClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`
        zone_id,
        zones!left(name)
      `)
      .eq("id", userId)
      .single()

    if (error) {
      console.error("getUserZone: Error al obtener perfil:", error)
      return { success: false, error: error.message }
    }

    if (!profile?.zone_id) {
      return { success: false, error: "Usuario sin zona asignada" }
    }

    console.log("getUserZone: Zona obtenida:", profile.zones?.name)
    return {
      success: true,
      data: {
        zoneId: profile.zone_id,
        zoneName: profile.zones?.name || "Sin nombre",
      },
    }
  } catch (error: any) {
    console.error("getUserZone: Error general:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
