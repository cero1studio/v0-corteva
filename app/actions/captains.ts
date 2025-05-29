"use server"

import { adminSupabase } from "@/lib/supabase"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Obtiene la lista de capitanes disponibles en el sistema
 */
export async function getCaptains() {
  try {
    const supabase = createServerClient()

    const { data: captains, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("role", "capitan")
      .order("full_name")

    if (error) {
      console.error("Error al obtener capitanes:", error)
      throw new Error("No se pudieron cargar los capitanes")
    }

    return captains
  } catch (error) {
    console.error("Error en getCaptains:", error)
    throw new Error("Error al cargar los capitanes")
  }
}

/**
 * Obtiene un capitán específico por su ID
 */
export async function getCaptainById(captainId: string) {
  try {
    const supabase = createServerClient()

    const { data: captain, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, team_id")
      .eq("id", captainId)
      .eq("role", "capitan")
      .single()

    if (error) {
      console.error("Error al obtener capitán:", error)
      throw new Error("No se pudo cargar el capitán")
    }

    return captain
  } catch (error) {
    console.error("Error en getCaptainById:", error)
    throw new Error("Error al cargar el capitán")
  }
}

/**
 * Asigna un capitán a un equipo
 */
export async function assignCaptainToTeam(captainId: string, teamId: number) {
  try {
    const supabase = adminSupabase

    const { error } = await supabase.from("profiles").update({ team_id: teamId }).eq("id", captainId)

    if (error) {
      console.error("Error al asignar capitán al equipo:", error)
      throw new Error("No se pudo asignar el capitán al equipo")
    }

    return { success: true }
  } catch (error) {
    console.error("Error en assignCaptainToTeam:", error)
    throw new Error("Error al asignar el capitán al equipo")
  }
}
