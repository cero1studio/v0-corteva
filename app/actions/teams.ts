"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createTeam(formData: FormData) {
  const supabase = createServerClient()

  const name = formData.get("name") as string
  const zone_id = formData.get("zone_id") as string
  const distributor_id = formData.get("distributor_id") as string
  const captain_id = formData.get("captain_id") as string
  const goals = formData.get("goal") ? parseInt(formData.get("goal") as string, 10) : 0

  try {
    const { error } = await supabase.from("teams").insert({
      name,
      zone_id,
      distributor_id: distributor_id || null,
      captain_id,
      goals,
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

  const name = formData.get("name") as string | null
  const zone_id = formData.get("zone_id") as string | null
  const distributor_id = formData.get("distributor_id") as string | null
  const captain_id = formData.get("captain_id") as string | null
  const goals = formData.get("goal") ? parseInt(formData.get("goal") as string, 10) : null

  try {
    const updateData: any = {}
    if (name) updateData.name = name
    if (zone_id) updateData.zone_id = zone_id
    if (distributor_id !== null) updateData.distributor_id = distributor_id
    if (captain_id) updateData.captain_id = captain_id
    if (goals !== null) updateData.goals = goals

    const { error } = await supabase
      .from("teams")
      .update(updateData)
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
    // 1. Desvincular usuarios
    await supabase.from("profiles").update({ team_id: null }).eq("team_id", teamId)
    
    // 2. Desvincular ventas, tiros libres y clientes (para no perderlos, pero que ya no referencien al equipo borrado)
    await supabase.from("sales").update({ team_id: null }).eq("team_id", teamId)
    await supabase.from("free_kick_goals").update({ team_id: null }).eq("team_id", teamId)
    await supabase.from("competitor_clients").update({ team_id: null }).eq("team_id", teamId)
    
    // 3. Borrar penalizaciones porque siempre dependen del equipo
    await supabase.from("penalty_history").delete().eq("team_id", teamId)
    await supabase.from("penalties").delete().eq("team_id", teamId)

    // 4. Eliminar el equipo
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

export async function bulkDeleteTeams(teamIds: string[]) {
  const supabase = createServerClient()

  try {
    if (!teamIds || teamIds.length === 0) return { success: true }

    // 1. Desvincular usuarios
    await supabase.from("profiles").update({ team_id: null }).in("team_id", teamIds)
    
    // 2. Desvincular ventas, tiros libres y clientes (para no perderlos, pero que ya no referencien a los equipos borrados)
    await supabase.from("sales").update({ team_id: null }).in("team_id", teamIds)
    await supabase.from("free_kick_goals").update({ team_id: null }).in("team_id", teamIds)
    await supabase.from("competitor_clients").update({ team_id: null }).in("team_id", teamIds)
    
    // 3. Borrar penalizaciones porque siempre dependen del equipo
    await supabase.from("penalty_history").delete().in("team_id", teamIds)
    await supabase.from("penalties").delete().in("team_id", teamIds)

    // 4. Finalmente, borrar los equipos
    const { error } = await supabase.from("teams").delete().in("id", teamIds)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/equipos")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar equipos masivamente" }
  }
}
