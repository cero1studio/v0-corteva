"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createFreeKickGoal(formData: FormData) {
  const supabase = createServerSupabaseClient()

  try {
    const teamId = formData.get("teamId") as string
    const points = Number(formData.get("points")) || 0
    const reason = formData.get("reason") as string

    // Verificar que el usuario sea admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "No autorizado" }
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return { error: "Solo los administradores pueden adjudicar tiros libres" }
    }

    // Crear el gol por tiro libre
    const { error } = await supabase.from("free_kick_goals").insert({
      team_id: teamId,
      points: points,
      reason: reason,
      created_by: user.id,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al crear el tiro libre" }
  }
}

export async function getFreeKickGoals() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("free_kick_goals")
      .select(`
        *,
        teams (
          id,
          name,
          zones (
            id,
            name
          ),
          distributors (
            id,
            name
          )
        ),
        profiles:created_by (
          id,
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message, data: null }
    }

    return { data: data || [], error: null }
  } catch (error: any) {
    return { error: error.message || "Error al obtener tiros libres", data: null }
  }
}

export async function deleteFreeKickGoal(goalId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Verificar que el usuario sea admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "No autorizado" }
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return { error: "Solo los administradores pueden eliminar tiros libres" }
    }

    const { error } = await supabase.from("free_kick_goals").delete().eq("id", goalId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/tiros-libres")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el tiro libre" }
  }
}

export async function getFreeKickGoalsByTeam(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("free_kick_goals").select("*").eq("team_id", teamId)

    if (error) {
      return { error: error.message, data: null }
    }

    const totalPoints = data?.reduce((sum, goal) => sum + (goal.points || 0), 0) || 0

    return {
      data: data || [],
      totalPoints,
      error: null,
    }
  } catch (error: any) {
    return { error: error.message || "Error al obtener tiros libres del equipo", data: null }
  }
}
