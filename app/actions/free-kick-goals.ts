"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export type FreeKickGoal = {
  id: string
  team_id: string
  points: number
  reason: string
  created_at: string
  created_by: string
  team_name?: string
  zone_name?: string
}

export async function createFreeKickGoal(teamId: string, points: number, reason: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autorizado" }
    }

    const { data, error } = await supabase
      .from("free_kick_goals")
      .insert({
        team_id: teamId,
        points,
        reason,
        created_by: user.id,
      })
      .select()

    if (error) {
      console.error("Error al crear tiro libre:", error)
      return { error: error.message }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/admin/ranking")
    revalidatePath("/ranking")

    return { data }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { error: "Error inesperado al crear tiro libre" }
  }
}

export async function getFreeKickGoals() {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data, error } = await supabase
      .from("free_kick_goals")
      .select(`
        *,
        teams (
          id,
          name,
          zone_id,
          zones (
            id,
            name
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener tiros libres:", error)
      return { error: error.message }
    }

    // Formatear los datos para facilitar su uso
    const formattedData = data.map((item) => ({
      id: item.id,
      team_id: item.team_id,
      points: item.points,
      reason: item.reason,
      created_at: item.created_at,
      created_by: item.created_by,
      team_name: item.teams?.name || "Equipo desconocido",
      zone_name: item.teams?.zones?.name || "Zona desconocida",
    }))

    return { data: formattedData }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { error: "Error inesperado al obtener tiros libres" }
  }
}

export async function deleteFreeKickGoal(id: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    const { error } = await supabase.from("free_kick_goals").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar tiro libre:", error)
      return { error: error.message }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/admin/ranking")
    revalidatePath("/ranking")

    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { error: "Error inesperado al eliminar tiro libre" }
  }
}

export async function getTeamFreeKickPoints(teamId: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data, error } = await supabase.from("free_kick_goals").select("points").eq("team_id", teamId)

    if (error) {
      console.error("Error al obtener puntos de tiros libres:", error)
      return { error: error.message }
    }

    const totalPoints = data.reduce((sum, item) => sum + item.points, 0)

    return { data: totalPoints }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { error: "Error inesperado al obtener puntos de tiros libres", data: 0 }
  }
}
