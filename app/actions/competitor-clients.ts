"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Constante para la conversión de clientes a goles (3 clientes = 1 gol)
const CLIENTES_POR_GOL = 3

export async function registerCompetitorClient(formData: FormData) {
  const supabase = createServerSupabaseClient()

  // Obtener datos del formulario
  const clientName = formData.get("client_name") as string
  const clientNameCompetitora = (formData.get("client_name_competitora") as string) || null
  const ganaderoName = (formData.get("ganadero_name") as string) || null
  const razonSocial = (formData.get("razon_social") as string) || null
  const tipoVenta = (formData.get("tipo_venta") as string) || null
  const nombreAlmacen = (formData.get("nombre_almacen") as string) || null
  const ubicacionFinca = (formData.get("ubicacion_finca") as string) || null
  const areaFincaHectareas = Number(formData.get("area_finca_hectareas")) || null
  const productoAnterior = (formData.get("producto_anterior") as string) || null
  const productoSuperGanaderia = (formData.get("producto_super_ganaderia") as string) || null
  const volumenVentaEstimado = (formData.get("volumen_venta_estimado") as string) || null
  const contactInfo = (formData.get("contact_info") as string) || null
  const notes = (formData.get("notes") as string) || null
  const points = Number(formData.get("points")) || 5 // Default to 5 points
  const teamId = formData.get("team_id") as string
  const representativeId = formData.get("representative") as string

  try {
    // Registrar el cliente
    const { data, error } = await supabase
      .from("competitor_clients")
      .insert({
        client_name: clientName,
        competitor_name: clientNameCompetitora,
        ganadero_name: ganaderoName,
        razon_social: razonSocial,
        tipo_venta: tipoVenta,
        nombre_almacen: nombreAlmacen,
        ubicacion_finca: ubicacionFinca,
        area_finca_hectareas: areaFincaHectareas,
        producto_anterior: productoAnterior,
        producto_super_ganaderia: productoSuperGanaderia,
        volumen_venta_estimado: volumenVentaEstimado,
        contact_info: contactInfo,
        notes: notes,
        points: points,
        team_id: teamId,
        representative_id: representativeId,
      })
      .select()

    if (error) throw new Error(`Error al registrar cliente: ${error.message}`)

    // Revalidar rutas relevantes
    revalidatePath("/capitan/dashboard")
    revalidatePath("/capitan/clientes")
    revalidatePath("/admin/dashboard")
    revalidatePath("/ranking")
    revalidatePath("/capitan/ranking")
    revalidatePath("/admin/clientes") // Revalidar la página de clientes

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
        client_name_competitora,
        ganadero_name,
        razon_social,
        tipo_venta,
        ubicacion_finca,
        area_finca_hectareas,
        producto_anterior,
        producto_super_ganaderia,
        volumen_venta_estimado,
        contact_info,
        notes,
        nombre_almacen,
        points,
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
        ),
        teams:team_id (
          id,
          name,
          zone_id,
          zones:zone_id (
            id,
            name
          )
        )
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Flatten the team and zone data for easier access in the frontend
    const formattedData = data?.map((client) => ({
      ...client,
      representative_profile: client.profiles,
      team: client.teams
        ? {
            ...client.teams,
            zone: client.teams.zones,
          }
        : null,
      profiles: undefined, // Remove original nested profiles
      teams: undefined, // Remove original nested teams
    }))

    return { success: true, data: formattedData }
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
        client_name_competitora,
        ganadero_name,
        razon_social,
        tipo_venta,
        ubicacion_finca,
        area_finca_hectareas,
        producto_anterior,
        producto_super_ganaderia,
        volumen_venta_estimado,
        contact_info,
        notes,
        nombre_almacen,
        points,
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

    // Flatten the team and zone data for easier access in the frontend
    const formattedData = data?.map((client) => ({
      ...client,
      representative_profile: client.profiles,
      team: client.profiles?.teams
        ? {
            ...client.profiles.teams,
            zone: client.profiles.teams.zones,
          }
        : null,
      profiles: undefined, // Remove original nested profiles
    }))

    return { success: true, data: formattedData }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByUser:", error)
    return { success: false, error: error.message }
  }
}

export async function getAllCompetitorClients() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select(`
        id,
        client_name,
        client_name_competitora,
        ganadero_name,
        razon_social,
        tipo_venta,
        ubicacion_finca,
        area_finca_hectareas,
        producto_anterior,
        producto_super_ganaderia,
        volumen_venta_estimado,
        contact_info,
        notes,
        nombre_almacen,
        points,
        created_at,
        representative_id,
        profiles:representative_id (
          id,
          full_name
        ),
        teams:team_id (
          id,
          name,
          zone_id,
          zones:zone_id (
            id,
            name
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Flatten the data for easier access in the frontend
    const formattedData = data?.map((client) => ({
      ...client,
      representative_profile: client.profiles,
      team: client.teams
        ? {
            ...client.teams,
            zone: client.teams.zones,
          }
        : null,
      profiles: undefined, // Remove original nested profiles
      teams: undefined, // Remove original nested teams
    }))

    return { success: true, data: formattedData }
  } catch (error: any) {
    console.error("Error en getAllCompetitorClients:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteCompetitorClient(clientId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.from("competitor_clients").delete().eq("id", clientId)

    if (error) throw error

    revalidatePath("/admin/clientes")
    return { success: true }
  } catch (error: any) {
    console.error("Error en deleteCompetitorClient:", error)
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
