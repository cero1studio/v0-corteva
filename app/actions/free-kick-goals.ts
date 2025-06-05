"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
  const supabase = createServerClient()

  try {
    const teamId = formData.get("team_id") as string
    const points = Number.parseInt(formData.get("points") as string)
    const reason = formData.get("reason") as string

    if (!teamId || !points || !reason) {
      return { success: false, message: "Todos los campos son requeridos" }
    }

    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user:", userError)
      redirect("/login")
    }

    // Verificar el rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("Error getting profile:", profileError)
      return { success: false, message: "Error al verificar permisos" }
    }

    if (profile.role !== "admin") {
      return { success: false, message: "Solo los administradores pueden adjudicar tiros libres" }
    }

    // Insertar el tiro libre
    const { error: insertError } = await supabase.from("free_kick_goals").insert({
      team_id: teamId,
      points: points,
      reason: reason,
      created_by: user.id,
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
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
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
  const supabase = createServerClient()

  try {
    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user:", userError)
      redirect("/login")
    }

    // Verificar el rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("Error getting profile:", profileError)
      return { success: false, message: "Error al verificar permisos" }
    }

    if (profile.role !== "admin") {
      return { success: false, message: "Solo los administradores pueden eliminar tiros libres" }
    }

    const { error: deleteError } = await supabase.from("free_kick_goals").delete().eq("id", id)

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
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("zones").select("id, name").order("name", { ascending: true })

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
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
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
