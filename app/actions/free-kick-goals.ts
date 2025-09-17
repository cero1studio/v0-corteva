"use server"

import { adminSupabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSystemConfig } from "./system-config"

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
    captain_id: string
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
          // No incluir created_by, será null por defecto
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
          captain_id,
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

    const goalsWithCaptains = await Promise.all(
      (goals || []).map(async (goal) => {
        if (goal.teams?.captain_id) {
          const { data: captain } = await adminSupabase
            .from("profiles")
            .select("full_name")
            .eq("id", goal.teams.captain_id)
            .single()

          return {
            ...goal,
            captain_name: captain?.full_name || "Sin capitán",
          }
        }
        return {
          ...goal,
          captain_name: "Sin capitán",
        }
      }),
    )

    return goalsWithCaptains
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
    revalidatePath("/admin/ranking")
    revalidatePath("/admin/dashboard")
    revalidatePath("/capitan/dashboard")
    revalidatePath("/capitan/ranking")
    revalidatePath("/director-tecnico/ranking")
    revalidatePath("/ranking")
    revalidatePath("/ranking-publico")
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

export async function getCaptainsByZone(zoneId: string) {
  try {
    // Usar la relación específica profiles.team_id -> teams.id
    const { data: captains, error } = await adminSupabase
      .from("profiles")
      .select(`
        id,
        full_name,
        team_id,
        teams:team_id (
          id,
          name,
          zone_id
        )
      `)
      .eq("role", "capitan")
      .eq("teams.zone_id", zoneId)
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Error fetching captains by zone:", error)
      return []
    }

    return (captains || []).map((captain) => ({
      id: captain.id,
      full_name: captain.full_name,
      team_id: captain.team_id,
      teams: captain.teams,
    }))
  } catch (error) {
    console.error("Unexpected error fetching captains by zone:", error)
    return []
  }
}

export async function getCurrentChallenge() {
  try {
    const result = await getSystemConfig("reto_actual")
    return result.success ? result.data || "" : ""
  } catch (error) {
    console.error("Error fetching current challenge:", error)
    return ""
  }
}

export async function exportFreeKickGoalsToExcel() {
  try {
    const goals = await getFreeKickGoals()

    const exportData = goals.map((goal) => ({
      Equipo: goal.teams?.name || "Sin equipo",
      Capitán: goal.captain_name || "Sin capitán",
      Zona: goal.teams?.zones?.name || "Sin zona",
      Goles: Math.floor(goal.points / 100),
      Puntos: goal.points,
      Razón: goal.reason,
      Fecha: new Date(goal.created_at).toLocaleDateString("es-ES"),
      "Creado por": goal.profiles?.full_name || "Admin",
    }))

    return { success: true, data: exportData }
  } catch (error: any) {
    console.error("Error exporting free kick goals:", error)
    return { success: false, error: error.message }
  }
}
