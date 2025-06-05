"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface FreeKickGoal {
  id: string
  team_id: string
  points: number
  reason: string
  created_by: string
  created_at: string
  teams: {
    name: string
    zone: string
  }
  profiles: {
    full_name: string
  }
}

export async function createFreeKickGoal(formData: FormData) {
  const supabase = createServerClient()

  try {
    const teamId = formData.get("team_id") as string
    const points = Number.parseInt(formData.get("points") as string)
    const reason = formData.get("reason") as string

    // Verificar que el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("No autorizado")
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      throw new Error("Solo los administradores pueden adjudicar tiros libres")
    }

    const { error } = await supabase.from("free_kick_goals").insert({
      team_id: teamId,
      points: points,
      reason: reason,
      created_by: user.id,
    })

    if (error) throw error

    revalidatePath("/admin/tiros-libres")
    return { success: true, message: "Tiro libre adjudicado exitosamente" }
  } catch (error) {
    console.error("Error creating free kick goal:", error)
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" }
  }
}

export async function getFreeKickGoals() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("free_kick_goals")
      .select(`
        *,
        teams (name, zone),
        profiles (full_name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as FreeKickGoal[]
  } catch (error) {
    console.error("Error fetching free kick goals:", error)
    return []
  }
}

export async function deleteFreeKickGoal(id: string) {
  const supabase = createServerClient()

  try {
    // Verificar que el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("No autorizado")
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      throw new Error("Solo los administradores pueden eliminar tiros libres")
    }

    const { error } = await supabase.from("free_kick_goals").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin/tiros-libres")
    return { success: true, message: "Tiro libre eliminado exitosamente" }
  } catch (error) {
    console.error("Error deleting free kick goal:", error)
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" }
  }
}

export async function getTeamsForFreeKick() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, zone")
      .order("zone", { ascending: true })
      .order("name", { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching teams:", error)
    return []
  }
}
