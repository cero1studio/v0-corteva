"use server"

import { createServerClient } from "@/lib/supabase/server" // Import from centralized server client
import { revalidatePath } from "next/cache"

export async function registerCompetitorClient(formData: FormData) {
  const supabase = createServerClient() // Use the centralized client

  const client_name = formData.get("client_name") as string
  const competitor_name = formData.get("competitor_name") as string // Corrected column name
  const ganadero_name = formData.get("ganadero_name") as string
  const razon_social = formData.get("razon_social") as string
  const tipo_venta = formData.get("tipo_venta") as string
  const ubicacion_finca = formData.get("ubicacion_finca") as string
  const area_finca_hectareas = Number.parseFloat(formData.get("area_finca_hectareas") as string)
  const producto_anterior = formData.get("producto_anterior") as string
  const producto_super_ganaderia = formData.get("producto_super_ganaderia") as string
  const volumen_venta_estimado = formData.get("volumen_venta_estimado") as string
  const contact_info = formData.get("contact_info") as string
  const notes = formData.get("notes") as string
  const nombre_almacen = formData.get("nombre_almacen") as string
  const points = Number.parseInt(formData.get("points") as string)
  const team_id = formData.get("team_id") as string
  const representative_id = formData.get("representative") as string

  try {
    const { error } = await supabase.from("competitor_clients").insert({
      client_name,
      competitor_name, // Corrected column name
      ganadero_name,
      razon_social,
      tipo_venta,
      ubicacion_finca,
      area_finca_hectareas: isNaN(area_finca_hectareas) ? null : area_finca_hectareas,
      producto_anterior,
      producto_super_ganaderia,
      volumen_venta_estimado,
      contact_info,
      notes,
      nombre_almacen: tipo_venta === "distribuidor" ? nombre_almacen : null,
      points: isNaN(points) ? 0 : points,
      team_id,
      representative_id,
    })

    if (error) {
      console.error("Error al registrar cliente de la competencia:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/clientes")
    return { success: true, message: "Cliente de la competencia registrado exitosamente" }
  } catch (error: any) {
    console.error("Error inesperado al registrar cliente de la competencia:", error)
    return { success: false, error: error.message || "Error inesperado al registrar cliente" }
  }
}

export async function getAllCompetitorClients() {
  const supabase = createServerClient() // Use the centralized client

  const { data, error } = await supabase
    .from("competitor_clients")
    .select(
      `
      id,
      client_name,
      competitor_name,
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
      representative_profile:profiles!representative_id (
        id,
        full_name
      ),
      team:teams!inner (
        id,
        name,
        zone:zones!zone_id (
          id,
          name
        )
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al obtener clientes de la competencia:", error)
    return { success: false, data: [], error: error.message }
  }

  return { success: true, data: data || [], error: null }
}

export async function deleteCompetitorClient(clientId: string) {
  const supabase = createServerClient() // Use the centralized client

  try {
    const { error } = await supabase.from("competitor_clients").delete().eq("id", clientId)

    if (error) {
      console.error("Error al eliminar cliente de la competencia:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/clientes")
    return { success: true, message: "Cliente de la competencia eliminado exitosamente" }
  } catch (error: any) {
    console.error("Error inesperado al eliminar cliente de la competencia:", error)
    return { success: false, error: error.message || "Error inesperado al eliminar cliente" }
  }
}
