"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllCompetitorClients() {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select(`
        *,
        representative_profile:representative_id(
          id, 
          full_name,
          team_id,
          team:team_id(
            id,
            name,
            zone:zone_id(id, name)
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Transformar los datos para que coincidan con la estructura esperada
    const transformedData = data?.map((client) => ({
      ...client,
      team: client.representative_profile?.team || null,
    }))

    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("Error en getAllCompetitorClients:", error)
    return { success: false, error: error.message }
  }
}

export async function createCompetitorClient(formData: FormData) {
  const supabase = createServerSupabaseClient()

  try {
    const clientData = {
      client_name: formData.get("client_name") as string,
      client_name_competitora: formData.get("client_name_competitora") as string,
      ganadero_name: formData.get("ganadero_name") as string,
      razon_social: formData.get("razon_social") as string,
      tipo_venta: formData.get("tipo_venta") as string,
      ubicacion_finca: formData.get("ubicacion_finca") as string,
      area_finca_hectareas: formData.get("area_finca_hectareas")
        ? Number.parseFloat(formData.get("area_finca_hectareas") as string)
        : null,
      producto_anterior: formData.get("producto_anterior") as string,
      producto_super_ganaderia: formData.get("producto_super_ganaderia") as string,
      volumen_venta_estimado: formData.get("volumen_venta_estimado") as string,
      representative_id: formData.get("representative") as string,
      points: formData.get("points") ? Number.parseInt(formData.get("points") as string) : 5,
    }

    // Obtener el team_id del representante
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", clientData.representative_id)
      .single()

    if (profileError) throw new Error(`Error al obtener perfil: ${profileError.message}`)
    if (!profile || !profile.team_id) throw new Error("Representante sin equipo asignado")

    // Insertar el cliente
    const { data, error } = await supabase
      .from("competitor_clients")
      .insert({
        client_name: clientData.client_name,
        client_name_competitora: clientData.client_name_competitora,
        ganadero_name: clientData.ganadero_name,
        razon_social: clientData.razon_social,
        tipo_venta: clientData.tipo_venta,
        ubicacion_finca: clientData.ubicacion_finca,
        area_finca_hectareas: clientData.area_finca_hectareas,
        producto_anterior: clientData.producto_anterior,
        producto_super_ganaderia: clientData.producto_super_ganaderia,
        volumen_venta_estimado: clientData.volumen_venta_estimado,
        representative_id: clientData.representative_id,
        points: clientData.points,
        team_id: profile.team_id,
      })
      .select()

    if (error) throw new Error(`Error al crear cliente: ${error.message}`)

    revalidatePath("/admin/clientes")
    revalidatePath("/capitan/clientes")
    revalidatePath("/capitan/dashboard")

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en createCompetitorClient:", error)
    return { success: false, error: error.message }
  }
}

export async function updateCompetitorClient(id: string, formData: FormData) {
  const supabase = createServerSupabaseClient()

  try {
    const clientData = {
      client_name: formData.get("client_name") as string,
      client_name_competitora: formData.get("client_name_competitora") as string,
      ganadero_name: formData.get("ganadero_name") as string,
      razon_social: formData.get("razon_social") as string,
      tipo_venta: formData.get("tipo_venta") as string,
      ubicacion_finca: formData.get("ubicacion_finca") as string,
      area_finca_hectareas: formData.get("area_finca_hectareas")
        ? Number.parseFloat(formData.get("area_finca_hectareas") as string)
        : null,
      producto_anterior: formData.get("producto_anterior") as string,
      producto_super_ganaderia: formData.get("producto_super_ganaderia") as string,
      volumen_venta_estimado: formData.get("volumen_venta_estimado") as string,
      representative_id: formData.get("representative") as string,
      points: formData.get("points") ? Number.parseInt(formData.get("points") as string) : 5,
    }

    // Obtener el team_id del representante
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", clientData.representative_id)
      .single()

    if (profileError) throw new Error(`Error al obtener perfil: ${profileError.message}`)
    if (!profile || !profile.team_id) throw new Error("Representante sin equipo asignado")

    const { data, error } = await supabase
      .from("competitor_clients")
      .update({
        client_name: clientData.client_name,
        client_name_competitora: clientData.client_name_competitora,
        ganadero_name: clientData.ganadero_name,
        razon_social: clientData.razon_social,
        tipo_venta: clientData.tipo_venta,
        ubicacion_finca: clientData.ubicacion_finca,
        area_finca_hectareas: clientData.area_finca_hectareas,
        producto_anterior: clientData.producto_anterior,
        producto_super_ganaderia: clientData.producto_super_ganaderia,
        volumen_venta_estimado: clientData.volumen_venta_estimado,
        representative_id: clientData.representative_id,
        points: clientData.points,
        team_id: profile.team_id,
      })
      .eq("id", id)
      .select()

    if (error) throw error

    revalidatePath("/admin/clientes")
    revalidatePath("/capitan/clientes")
    revalidatePath("/capitan/dashboard")

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en updateCompetitorClient:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteCompetitorClient(id: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.from("competitor_clients").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin/clientes")
    revalidatePath("/capitan/clientes")
    revalidatePath("/capitan/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error en deleteCompetitorClient:", error)
    return { success: false, error: error.message }
  }
}

export async function getCompetitorClientsByTeam(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function getCompetitorClientsByRepresentative(representativeId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select("*")
      .eq("representative_id", representativeId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByRepresentative:", error)
    return { success: false, error: error.message }
  }
}
