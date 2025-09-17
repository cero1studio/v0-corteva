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
      id: string
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
            id,
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

    const teamIds = (goals || []).map((goal) => goal.team_id).filter(Boolean)

    let captainNames = {}
    if (teamIds.length > 0) {
      const { data: captains, error: captainsError } = await adminSupabase
        .from("profiles")
        .select("team_id, full_name")
        .eq("role", "capitan")
        .in("team_id", teamIds)

      if (!captainsError && captains) {
        captainNames = captains.reduce(
          (acc, captain) => ({
            ...acc,
            [captain.team_id]: captain.full_name,
          }),
          {},
        )
      }
    }

    const goalsWithCaptains = (goals || []).map((goal) => ({
      ...goal,
      captain_name: captainNames[goal.team_id] || "Sin capitán",
    }))

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
    // Primero obtener los capitanes de la zona
    const { data: captains, error: captainsError } = await adminSupabase
      .from("profiles")
      .select("id, full_name, team_id")
      .eq("role", "capitan")
      .eq("zone_id", zoneId)
      .order("full_name", { ascending: true })

    if (captainsError) {
      console.error("Error fetching captains:", captainsError)
      return []
    }

    if (!captains || captains.length === 0) {
      return []
    }

    // Obtener los equipos de estos capitanes
    const teamIds = captains.map((captain) => captain.team_id).filter(Boolean)

    if (teamIds.length === 0) {
      // Si no hay equipos, devolver capitanes sin información de equipo
      return captains.map((captain) => ({
        id: captain.id,
        full_name: captain.full_name,
        team_id: captain.team_id,
        teams: null,
      }))
    }

    const { data: teams, error: teamsError } = await adminSupabase.from("teams").select("id, name").in("id", teamIds)

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      // Continuar sin información de equipos
    }

    // Crear mapa de equipos
    const teamMap = (teams || []).reduce((map, team) => ({ ...map, [team.id]: team }), {})

    // Combinar capitanes con información de equipos
    return captains.map((captain) => ({
      id: captain.id,
      full_name: captain.full_name,
      team_id: captain.team_id,
      teams: captain.team_id && teamMap[captain.team_id] ? teamMap[captain.team_id] : null,
    }))
  } catch (error) {
    console.error("Unexpected error fetching captains:", error)
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
      Goles: Number(Math.floor(goal.points / 100)), // Asegurar que sea número
      Puntos: Number(goal.points), // Asegurar que sea número
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
