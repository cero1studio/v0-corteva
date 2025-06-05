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
  const team_id = formData.get("team_id") as string
  const goals = formData.get("goals") as string
  const reason = formData.get("reason") as string

  try {
    // Validar datos requeridos
    if (!team_id || !goals || !reason) {
      throw new Error("Faltan datos requeridos")
    }

    const finalGoals = Number.parseInt(goals)

    if (!finalGoals || finalGoals <= 0) {
      throw new Error("Los goles no son válidos")
    }

    // Convertir goles a puntos (1 gol = 100 puntos)
    const points = finalGoals * 100

    const { data, error } = await adminSupabase
      .from("free_kick_goals")
      .insert([
        {
          team_id: team_id,
          points: points,
          reason: reason,
          created_by: "00000000-0000-0000-0000-000000000000", // UUID fijo para admin
        },
      ])
      .select()

    if (error) {
      console.error("Error registering free kick goal:", error)
      throw error
    }

    revalidatePath("/admin/tiros-libres")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error in createFreeKickGoal:", error)
    return { success: false, error: error.message }
  }
}

export async function getFreeKickGoals() {
  try {
    const { data: goals, error } = await adminSupabase.from("free_kick_goals").select(`
        id,
        team_id,
        points,
        reason,
        created_by,
        created_at,
        teams (
          name,
          zone_id,
          zones (
            name
          )
        ),
        profiles (
          full_name
        )
    `)

    if (error) {
      console.error("Error fetching free kick goals:", error)
      return []
    }

    return goals || []
  } catch (error) {
    console.error("Unexpected error fetching free kick goals:", error)
    return []
  }
}

export async function getFreeKickGoalsByTeam(teamId: string) {
  try {
    const { data, error } = await adminSupabase
      .from("free_kick_goals")
      .select(`
        id,
        team_id,
        points,
        reason,
        created_by,
        created_at
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching free kick goals by team:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Unexpected error fetching free kick goals by team:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function deleteFreeKickGoal(id: string) {
  try {
    const { error } = await adminSupabase.from("free_kick_goals").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin/tiros-libres")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting free kick goal:", error)
    return { success: false, error: error.message }
  }
}

export async function getZones() {
  try {
    const { data: zones, error } = await adminSupabase
      .from("zones")
      .select("id, name")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching zones:", error)
      return []
    }

    return zones || []
  } catch (error) {
    console.error("Unexpected error fetching zones:", error)
    return []
  }
}

export async function getTeamsByZone(zoneId: string) {
  try {
    const { data: teams, error } = await adminSupabase
      .from("teams")
      .select("id, name")
      .eq("zone_id", zoneId)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching teams:", error)
      return []
    }

    return teams || []
  } catch (error) {
    console.error("Unexpected error fetching teams:", error)
    return []
  }
}
