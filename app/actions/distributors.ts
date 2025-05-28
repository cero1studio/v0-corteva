"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function registerCompetitorClient(formData: FormData) {
  const supabase = createServerSupabaseClient()

  // Obtener datos del formulario
  const name = formData.get("name") as string
  const previousSupplier = formData.get("previousSupplier") as string
  const contactInfo = formData.get("contactInfo") as string
  const notes = formData.get("notes") as string
  const capturedBy = formData.get("userId") as string

  try {
    // Obtener información del usuario y equipo
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", capturedBy)
      .single()

    if (profileError) throw new Error(`Error al obtener perfil: ${profileError.message}`)
    if (!profile || !profile.team_id) throw new Error("Usuario sin equipo asignado")

    // Registrar el cliente
    const { data, error } = await supabase
      .from("competitor_clients")
      .insert({
        name,
        previous_supplier: previousSupplier,
        contact_info: contactInfo,
        notes,
        captured_by: capturedBy,
        team_id: profile.team_id,
        capture_date: new Date().toISOString().split("T")[0],
      })
      .select()

    if (error) throw new Error(`Error al registrar cliente: ${error.message}`)

    // Verificar si se cumple el objetivo semanal para otorgar penalti
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Lunes de la semana actual

    const { data: weekClients, error: weekClientsError } = await supabase
      .from("competitor_clients")
      .select("id")
      .eq("team_id", profile.team_id)
      .gte("capture_date", startOfWeek.toISOString().split("T")[0])

    if (weekClientsError) throw new Error(`Error al obtener clientes semanales: ${weekClientsError.message}`)

    // Obtener configuración del sistema
    const { data: penaltyConfig, error: configError } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "penalty_settings")
      .single()

    if (configError) throw new Error(`Error al obtener configuración: ${configError.message}`)

    const config = penaltyConfig.value
    const clientTarget = 3 // Objetivo de clientes captados (podría ser configurable)
    const penaltyReward = config.challenge_reward || 1

    // Verificar si se alcanzó el objetivo de clientes semanales
    const weeklyCount = weekClients ? weekClients.length : 0

    if (weeklyCount >= clientTarget) {
      // Verificar si ya se otorgó un penalti esta semana por este motivo
      const { data: existingPenalty, error: penaltyCheckError } = await supabase
        .from("penalty_history")
        .select("id")
        .eq("team_id", profile.team_id)
        .eq("action", "earned")
        .gte("created_at", startOfWeek.toISOString())
        .ilike("description", "%clientes de la competencia%")

      if (penaltyCheckError) throw new Error(`Error al verificar penaltis: ${penaltyCheckError.message}`)

      // Si no se ha otorgado un penalti esta semana, otorgar uno
      if (!existingPenalty || existingPenalty.length === 0) {
        // Crear nuevo penalti
        const { data: penalty, error: penaltyError } = await supabase
          .from("penalties")
          .insert({
            team_id: profile.team_id,
            quantity: penaltyReward,
            used: 0,
            reason: "Objetivo semanal de captación de clientes alcanzado",
          })
          .select()
          .single()

        if (penaltyError) throw new Error(`Error al crear penalti: ${penaltyError.message}`)

        // Registrar en historial
        await supabase.from("penalty_history").insert({
          penalty_id: penalty.id,
          team_id: profile.team_id,
          action: "earned",
          quantity: penaltyReward,
          description: "Objetivo semanal de captación de clientes de la competencia alcanzado",
        })
      }
    }

    revalidatePath("/capitan/dashboard")
    revalidatePath("/admin/dashboard")

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en registerCompetitorClient:", error)
    return { success: false, error: error.message }
  }
}

export async function getCompetitorClientsByTeam(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select(`
        id,
        name,
        previous_supplier,
        contact_info,
        notes,
        capture_date,
        created_at,
        profiles (id, full_name)
      `)
      .eq("team_id", teamId)
      .order("capture_date", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function getCompetitorClientsByUser(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select(`
        id,
        name,
        previous_supplier,
        contact_info,
        notes,
        capture_date,
        created_at
      `)
      .eq("captured_by", userId)
      .order("capture_date", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByUser:", error)
    return { success: false, error: error.message }
  }
}
