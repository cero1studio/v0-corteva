"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function registerCompetitorClient(formData: FormData) {
  const supabase = createServerClient()

  const client_name = formData.get("client_name") as string
  const competitor_name = formData.get("competitor_name") as string | null
  const ganadero_name = formData.get("ganadero_name") as string | null
  const razon_social = formData.get("razon_social") as string | null
  const tipo_venta = formData.get("tipo_venta") as string | null
  const ubicacion_finca = formData.get("ubicacion_finca") as string | null
  const area_finca_hectareas_str = formData.get("area_finca_hectareas") as string
  const producto_anterior = formData.get("producto_anterior") as string | null
  const producto_super_ganaderia = formData.get("producto_super_ganaderia") as string | null
  const volumen_venta_estimado = formData.get("volumen_venta_estimado") as string | null
  const contact_info = formData.get("contact_info") as string | null
  const notes = formData.get("notes") as string | null
  const nombre_almacen = formData.get("nombre_almacen") as string | null
  const points_str = formData.get("points") as string
  const team_id = formData.get("team_id") as string
  const representative_id = formData.get("representative_id") as string

  const area_finca_hectareas = area_finca_hectareas_str ? Number.parseFloat(area_finca_hectareas_str) : null
  const points = points_str ? Number.parseInt(points_str) : 5

  try {
    const { error } = await supabase.from("competitor_clients").insert({
      client_name,
      competitor_name,
      ganadero_name,
      razon_social,
      tipo_venta,
      ubicacion_finca,
      area_finca_hectareas: isNaN(area_finca_hectareas as number) ? null : area_finca_hectareas,
      producto_anterior,
      producto_super_ganaderia,
      volumen_venta_estimado,
      contact_info,
      notes,
      nombre_almacen: tipo_venta === "distribuidor" ? nombre_almacen : null,
      points: isNaN(points) ? 5 : points,
      team_id,
      representative_id,
    })

    if (error) {
      console.error("Error al registrar cliente de la competencia:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/clientes")
    return { success: true, message: "Cliente registrado exitosamente" }
    // Remover el redirect de aquí ya que debe manejarse en el cliente
  } catch (error: any) {
    console.error("Error inesperado al registrar cliente de la competencia:", error)
    return { success: false, error: error.message || "Error inesperado al registrar cliente" }
  }
}

export async function getAllCompetitorClients() {
  const supabase = createServerClient()

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
  const supabase = createServerClient()

  try {
    // 1. Obtener datos del cliente ANTES de eliminar
    const { data: client, error: fetchError } = await supabase
      .from("competitor_clients")
      .select("points, team_id")
      .eq("id", clientId)
      .single()

    if (fetchError) {
      console.error("Error fetching client before delete:", fetchError)
      throw fetchError
    }

    if (!client) {
      throw new Error("Cliente no encontrado")
    }

    // 2. Eliminar el cliente
    const { error: deleteError } = await supabase.from("competitor_clients").delete().eq("id", clientId)

    if (deleteError) {
      console.error("Error deleting competitor client:", deleteError)
      throw deleteError
    }

    // 3. RESTAR los puntos del equipo
    if (client.team_id && client.points) {
      // Obtener el total_points actual del equipo
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("total_points")
        .eq("id", client.team_id)
        .single()

      if (!teamError && teamData) {
        const currentPoints = teamData.total_points ?? 0
        const newTotalPoints = Math.max(currentPoints - client.points, 0)

        const { error: updateError } = await supabase
          .from("teams")
          .update({ total_points: newTotalPoints })
          .eq("id", client.team_id)

        if (updateError) {
          console.error("Error updating team points:", updateError)
          // No lanzamos error aquí para no revertir la eliminación
        }
      } else {
        console.error("Error fetching team points:", teamError)
      }
    }

    revalidatePath("/admin/clientes")
    return { success: true, message: "Cliente de la competencia eliminado exitosamente" }
  } catch (error: any) {
    console.error("Error inesperado al eliminar cliente de la competencia:", error)
    return { success: false, error: error.message || "Error inesperado al eliminar cliente" }
  }
}
