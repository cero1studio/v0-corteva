"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createTeam(formData: FormData) {
  const supabase = createServerClient()

  const name = formData.get("name") as string
  const zone_id = formData.get("zone_id") as string
  const captain_id = formData.get("captain_id") as string

  try {
    const { error } = await supabase.from("teams").insert({
      name,
      zone_id,
      captain_id,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/equipos")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al crear el equipo" }
  }
}

export async function getAllTeams() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("teams")
    .select(
      `
      id,
      name,
      captain_id,
      zone_id,
      profiles!captain_id ( id, full_name ),
      zones ( id, name )
    `,
    )
    .order("name", { ascending: true })

  if (error) {
    console.error("Error al obtener equipos:", error)
    return { success: false, data: [], error: error.message }
  }

  return { success: true, data: data || [], error: null }
}

export async function getTeamById(teamId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("teams")
    .select(
      `
      id,
      name,
      captain_id,
      zone_id,
      profiles!captain_id ( id, full_name ),
      zones ( id, name )
    `,
    )
    .eq("id", teamId)
    .single()

  if (error) {
    console.error("Error al obtener equipo:", error)
    return { success: false, data: null, error: error.message }
  }

  return { success: true, data, error: null }
}

export async function updateTeam(teamId: string, formData: FormData) {
  const supabase = createServerClient()

  const name = formData.get("name") as string
  const zone_id = formData.get("zone_id") as string
  const captain_id = formData.get("captain_id") as string

  try {
    const { error } = await supabase
      .from("teams")
      .update({
        name,
        zone_id,
        captain_id,
      })
      .eq("id", teamId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/equipos")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el equipo" }
  }
}

export async function deleteTeam(teamId: string) {
  const supabase = createServerClient()

  try {
    // Verificar si hay usuarios asociados a este equipo
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)

    if (countError) {
      return { error: countError.message }
    }

    if (count && count > 0) {
      return { error: "No se puede eliminar el equipo porque tiene usuarios asociados" }
    }

    // Eliminar el equipo
    const { error } = await supabase.from("teams").delete().eq("id", teamId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/equipos")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar el equipo" }
  }
}
