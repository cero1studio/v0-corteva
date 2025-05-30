"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Constante para la conversión de clientes a goles (3 clientes = 1 gol)
const CLIENTES_POR_GOL = 3

export async function registerCompetitorClient(formData: FormData) {
  const supabase = createServerSupabaseClient()

  // Obtener datos del formulario
  const clientName = formData.get("name") as string
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
        client_name: clientName,
        competitor_name: previousSupplier,
        ganadero_name: contactInfo,
        representative_id: capturedBy,
        team_id: profile.team_id,
        points: 0,
      })
      .select()

    if (error) throw new Error(`Error al registrar cliente: ${error.message}`)

    // Verificar si se cumple el objetivo para otorgar goles por clientes captados
    const { data: teamClients, error: clientsError } = await supabase
      .from("competitor_clients")
      .select("id")
      .eq("team_id", profile.team_id)

    if (clientsError) throw new Error(`Error al obtener clientes del equipo: ${clientsError.message}`)

    // Calcular goles basados en la cantidad de clientes (3 clientes = 1 gol)
    const totalClientes = teamClients?.length || 0
    const golesGenerados = Math.floor(totalClientes / CLIENTES_POR_GOL)

    // Obtener la configuración de puntos para un gol
    const { data: puntosConfig, error: puntosError } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "puntos_para_gol")
      .maybeSingle()

    // Por defecto 100 puntos = 1 gol si no hay configuración
    const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

    // Actualizar los puntos y goles del equipo
    const puntosClientes = golesGenerados * puntosParaGol

    // Obtener puntos actuales del equipo (de ventas)
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("total_points, goals")
      .eq("id", profile.team_id)
      .single()

    if (teamError) throw new Error(`Error al obtener datos del equipo: ${teamError.message}`)

    // Sumar los puntos de ventas con los puntos por clientes
    const totalPoints = (teamData?.total_points || 0) + puntosClientes
    const totalGoals = Math.floor(totalPoints / puntosParaGol)

    // Actualizar el equipo con los nuevos puntos y goles
    const { error: updateError } = await supabase
      .from("teams")
      .update({
        total_points: totalPoints,
        goals: totalGoals,
      })
      .eq("id", profile.team_id)

    if (updateError) throw new Error(`Error al actualizar equipo: ${updateError.message}`)

    revalidatePath("/capitan/dashboard")
    revalidatePath("/capitan/clientes")
    revalidatePath("/admin/dashboard")
    revalidatePath("/ranking")
    revalidatePath("/capitan/ranking")

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
        client_name,
        created_at,
        team_id,
        representative_id,
        profiles:representative_id (
          id, 
          full_name,
          team_id,
          teams:team_id (
            id,
            name,
            zone_id,
            zones:zone_id (
              id,
              name
            ),
            distributor_id,
            distributors:distributor_id (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

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
        client_name,
        created_at,
        representative_id,
        profiles:representative_id (
          id, 
          full_name,
          team_id,
          teams:team_id (
            id,
            name,
            zone_id,
            zones:zone_id (
              id,
              name
            ),
            distributor_id,
            distributors:distributor_id (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq("representative_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByUser:", error)
    return { success: false, error: error.message }
  }
}

export async function getClientGoalsInfo(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Obtener todos los clientes del equipo
    const { data: clients, error } = await supabase.from("competitor_clients").select("id").eq("team_id", teamId)

    if (error) throw error

    const totalClientes = clients?.length || 0
    const golesGenerados = Math.floor(totalClientes / CLIENTES_POR_GOL)
    const clientesParaSiguienteGol = CLIENTES_POR_GOL - (totalClientes % CLIENTES_POR_GOL)

    return {
      success: true,
      data: {
        totalClientes,
        golesGenerados,
        clientesParaSiguienteGol,
        clientesPorGol: CLIENTES_POR_GOL,
      },
    }
  } catch (error: any) {
    console.error("Error en getClientGoalsInfo:", error)
    return { success: false, error: error.message }
  }
}
