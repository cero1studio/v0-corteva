"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createFreeKickGoal(formData: FormData) {
  const supabase = createClient()

  try {
    const teamId = formData.get("team_id") as string
    const points = Number.parseInt(formData.get("points") as string)
    const reason = formData.get("reason") as string

    if (!teamId || !points || !reason) {
      return { error: "Todos los campos son requeridos" }
    }

    // Verificar que el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "No autorizado" }
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "admin") {
      return { error: "Solo los administradores pueden adjudicar tiros libres" }
    }

    // Crear el tiro libre
    const { error } = await supabase.from("free_kick_goals").insert({
      team_id: teamId,
      points: points,
      reason: reason,
      created_by: user.id,
    })

    if (error) {
      console.error("Error creating free kick goal:", error)
      return { error: "Error al crear el tiro libre" }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error in createFreeKickGoal:", error)
    return { error: "Error interno del servidor" }
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
      return { data: [], error: "Error al obtener los tiros libres" }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error in getFreeKickGoals:", error)
    return { data: [], error: "Error interno del servidor" }
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
      return { error: "No autorizado" }
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "admin") {
      return { error: "Solo los administradores pueden eliminar tiros libres" }
    }

    const { error } = await supabase.from("free_kick_goals").delete().eq("id", id)

    if (error) {
      console.error("Error deleting free kick goal:", error)
      return { error: "Error al eliminar el tiro libre" }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteFreeKickGoal:", error)
    return { error: "Error interno del servidor" }
  }
}

export async function getTeamsForFreeKick() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        zones (
          id,
          name
        )
      `)
      .order("name")

    if (error) {
      console.error("Error fetching teams:", error)
      return { data: [], error: "Error al obtener los equipos" }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error in getTeamsForFreeKick:", error)
    return { data: [], error: "Error interno del servidor" }
  }
}
