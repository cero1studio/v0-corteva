"\"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function getTeamPenalties(teamId: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("penalties")
      .select(`
        id,
        team_id,
        quantity,
        used,
        reason,
        created_at,
        teams (
          id,
          name,
          zone_id,
          distributor_id
        )
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener penaltis del equipo:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error al obtener penaltis:", error)
    return { success: false, error: error.message || "Error al obtener penaltis" }
  }
}

export async function getTeamPenaltyHistory(teamId: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("penalty_history")
      .select(`
        id,
        penalty_id,
        team_id,
        action,
        quantity,
        description,
        created_at
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener historial de penaltis del equipo:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error al obtener historial de penaltis:", error)
    return { success: false, error: error.message || "Error al obtener historial de penaltis" }
  }
}

export async function assignPenalty(teamId: string, quantity: number, reason: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data: penalty, error } = await supabase
      .from("penalties")
      .insert({
        team_id: teamId,
        quantity: quantity,
        used: 0,
        reason: reason,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al asignar penalti:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/penalties")
    return { success: true, data: penalty }
  } catch (error: any) {
    console.error("Error al asignar penalti:", error)
    return { success: false, error: error.message || "Error al asignar penalti" }
  }
}

export async function usePenalty(teamId: string, quantity: number, description: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Obtener el penalti menos reciente que no ha sido usado completamente
    const { data: penalty, error: penaltyError } = await supabase
      .from("penalties")
      .select("*")
      .eq("team_id", teamId)
      .gt("quantity", 0)
      .order("created_at", { ascending: true })
      .limit(1)
      .single()

    if (penaltyError) {
      console.error("Error al obtener penalti:", penaltyError)
      return { success: false, error: penaltyError.message }
    }

    if (!penalty) {
      return { success: false, error: "No hay penaltis disponibles" }
    }

    // Actualizar el penalti
    const { error: updateError } = await supabase
      .from("penalties")
      .update({ quantity: penalty.quantity - quantity })
      .eq("id", penalty.id)

    if (updateError) {
      console.error("Error al usar penalti:", updateError)
      return { success: false, error: updateError.message }
    }

    // Registrar en el historial
    const { error: historyError } = await supabase.from("penalty_history").insert({
      penalty_id: penalty.id,
      team_id: teamId,
      action: "used",
      quantity: quantity,
      description: description,
    })

    if (historyError) {
      console.error("Error al registrar historial:", historyError)
      return { success: false, error: historyError.message }
    }

    revalidatePath("/capitan/penalties")
    return { success: true }
  } catch (error: any) {
    console.error("Error al usar penalti:", error)
    return { success: false, error: error.message || "Error al usar penalti" }
  }
}
