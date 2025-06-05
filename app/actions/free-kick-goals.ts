"use server"

import { adminSupabase } from "@/lib/supabase/server"
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
    zone_id: string
    zones: {
      name: string
    }
  }
  profiles: {
    full_name: string
  }
}

export async function createFreeKickGoal(formData: FormData) {
  try {
    const teamId = formData.get("team_id") as string
    const points = Number.parseInt(formData.get("points") as string)
    const reason = formData.get("reason") as string

    if (!teamId || !points || !reason) {
      return { success: false, message: "Todos los campos son requeridos" }
    }

    // Usar adminSupabase directamente para todas las operaciones
    // Esto evita problemas de autenticación en server actions
    const { data: user, error: userError } = await adminSupabase.auth.getUser()

    if (userError) {
      console.error("Error getting user:", userError)
      return { success: false, message: "Error de autenticación" }
    }

    // Insertar el tiro libre usando adminSupabase
    const { error: insertError } = await adminSupabase.from("free_kick_goals").insert({
      team_id: teamId,
      points: points,
      reason: reason,
      created_by: user.user?.id || "system", // Fallback a "system" si no hay user.id
    })

    if (insertError) {
      console.error("Error inserting free kick goal:", insertError)
      return { success: false, message: "Error al guardar el tiro libre" }
    }

    revalidatePath("/admin/tiros-libres")
    return { success: true, message: "Tiro libre adjudicado exitosamente" }
  } catch (error) {
    console.error("Error creating free kick goal:", error)
    return { success: false, message: "Error inesperado" }
  }
}

export async function getFreeKickGoals() {
  try {
    // Usar adminSupabase para todas las operaciones
    const { data, error } = await adminSupabase
      .from("free_kick_goals")
      .select(`
        *,
        teams (
          name,
          zone_id,
          zones (name)
        ),
        profiles (full_name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching free kick goals:", error)
      return []
    }

    return data as FreeKickGoal[]
  } catch (error) {
    console.error("Error fetching free kick goals:", error)
    return []
  }
}

export async function deleteFreeKickGoal(id: string) {
  try {
    // Usar adminSupabase para todas las operaciones
    const { error: deleteError } = await adminSupabase.from("free_kick_goals").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting free kick goal:", deleteError)
      return { success: false, message: "Error al eliminar el tiro libre" }
    }

    revalidatePath("/admin/tiros-libres")
    return { success: true, message: "Tiro libre eliminado exitosamente" }
  } catch (error) {
    console.error("Error deleting free kick goal:", error)
    return { success: false, message: "Error inesperado" }
  }
}

export async function getZones() {
  try {
    // Usar adminSupabase para todas las operaciones
    const { data, error } = await adminSupabase.from("zones").select("id, name").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching zones:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching zones:", error)
    return []
  }
}

export async function getTeamsByZone(zoneId: string) {
  try {
    // Usar adminSupabase para todas las operaciones
    const { data, error } = await adminSupabase
      .from("teams")
      .select("id, name")
      .eq("zone_id", zoneId)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching teams:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching teams:", error)
    return []
  }
}
