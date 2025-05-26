"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSystemConfig } from "./system-config"
import { revalidatePath } from "next/cache"

// Asignar medallas semanales (sin penaltis extra)
export async function assignWeeklyMedals() {
  const supabase = createServerSupabaseClient()

  try {
    // Verificar si las medallas están habilitadas
    const { success: configSuccess, data: medalsConfig } = await getSystemConfig("medals_config")
    if (!configSuccess || !medalsConfig || !medalsConfig.enabled) {
      return { success: false, error: "Sistema de medallas deshabilitado" }
    }

    const now = new Date()
    const weekNumber = getWeekNumber(now)
    const year = now.getFullYear()

    // Verificar si ya se asignaron medallas para esta semana
    const { data: existingMedals, error: checkError } = await supabase
      .from("medals")
      .select("id")
      .eq("week_number", weekNumber)
      .eq("year", year)

    if (checkError) throw new Error(`Error al verificar medallas existentes: ${checkError.message}`)

    if (existingMedals && existingMedals.length > 0) {
      return { success: true, message: "Las medallas ya fueron asignadas para esta semana" }
    }

    // Obtener el ranking actual (top 3 equipos)
    const { data: ranking, error: rankingError } = await supabase.rpc("get_team_ranking", { limit_count: 3 })

    if (rankingError) throw new Error(`Error al obtener ranking: ${rankingError.message}`)
    if (!ranking || ranking.length === 0) {
      return { success: false, error: "No hay equipos en el ranking" }
    }

    // Asignar medallas a los tres primeros equipos (solo medallas, sin penaltis)
    const medals = []
    const medalTypes = ["gold", "silver", "bronze"]

    for (let i = 0; i < Math.min(3, ranking.length); i++) {
      medals.push({
        team_id: ranking[i].team_id,
        type: medalTypes[i],
        week_number: weekNumber,
        year,
        points: ranking[i].total_points,
      })
    }

    // Insertar medallas en la base de datos
    const { error: insertError } = await supabase.from("medals").insert(medals)

    if (insertError) throw new Error(`Error al insertar medallas: ${insertError.message}`)

    revalidatePath("/ranking")
    revalidatePath("/admin/ranking")
    revalidatePath("/capitan/ranking")

    return { success: true, data: medals }
  } catch (error: any) {
    console.error("Error en assignWeeklyMedals:", error)
    return { success: false, error: error.message }
  }
}

// Obtener medallas de un equipo
export async function getTeamMedals(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("medals")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Error al obtener medallas: ${error.message}`)

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getTeamMedals:", error)
    return { success: false, error: error.message }
  }
}

// Obtener medallas de la semana actual
export async function getCurrentWeekMedals() {
  const supabase = createServerSupabaseClient()

  try {
    const now = new Date()
    const weekNumber = getWeekNumber(now)
    const year = now.getFullYear()

    const { data, error } = await supabase
      .from("medals")
      .select(`
        id,
        type,
        week_number,
        year,
        points,
        created_at,
        teams (id, name)
      `)
      .eq("week_number", weekNumber)
      .eq("year", year)
      .order("type", { ascending: true })

    if (error) throw new Error(`Error al obtener medallas: ${error.message}`)

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getCurrentWeekMedals:", error)
    return { success: false, error: error.message }
  }
}

// Función auxiliar para obtener el número de semana
function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
