"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createFreeKickGoal(formData: FormData) {
  const supabase = createClient()

  try {
    // Verificar que el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "No autorizado" }
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Solo administradores pueden adjudicar tiros libres" }
    }

    const teamId = formData.get("team_id") as string
    const points = Number.parseInt(formData.get("points") as string)
    const reason = formData.get("reason") as string

    if (!teamId || !points || points <= 0) {
      return { success: false, error: "Datos inválidos" }
    }

    const { error } = await supabase.from("free_kick_goals").insert({
      team_id: teamId,
      points,
      reason,
      created_by: user.id,
    })

    if (error) {
      console.error("Error creating free kick goal:", error)
      return { success: false, error: "Error al crear el tiro libre" }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/capitan/dashboard")
    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error in createFreeKickGoal:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getFreeKickGoals() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("free_kick_goals")
      .select(`
        *,
        teams (
          name,
          zones (name)
        ),
        users!free_kick_goals_created_by_fkey (
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching free kick goals:", error)
      return { success: false, error: "Error al obtener tiros libres" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getFreeKickGoals:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function deleteFreeKickGoal(id: string) {
  const supabase = createClient()

  try {
    // Verificar que el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "No autorizado" }
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Solo administradores pueden eliminar tiros libres" }
    }

    const { error } = await supabase.from("free_kick_goals").delete().eq("id", id)

    if (error) {
      console.error("Error deleting free kick goal:", error)
      return { success: false, error: "Error al eliminar el tiro libre" }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/capitan/dashboard")
    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteFreeKickGoal:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getTeamFreeKickPoints(teamId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("free_kick_goals").select("points").eq("team_id", teamId)

    if (error) {
      console.error("Error fetching team free kick points:", error)
      return 0
    }

    return data?.reduce((total, goal) => total + goal.points, 0) || 0
  } catch (error) {
    console.error("Error in getTeamFreeKickPoints:", error)
    return 0
  }
}
