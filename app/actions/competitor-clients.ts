"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { reconcileTeamContestTotals } from "@/app/actions/team-points-sync"

export async function registerCompetitorClient(formData: FormData) {
  const supabase = createServerClient()

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
  const points = points_str ? Number.parseInt(points_str) : 200

  try {
    const { error } = await supabase.from("competitor_clients").insert({
      client_name: ganadero_name, // Usar ganadero_name como client_name
      competitor_name: ganadero_name, // Usar ganadero_name como competitor_name
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
      nombre_almacen: tipo_venta === "Venta por Almacén" ? nombre_almacen : null,
      points: isNaN(points) ? 200 : points,
      team_id,
      representative_id,
    })

    if (error) {
      console.error("Error al registrar cliente de la competencia:", error)
      return { success: false, error: error.message }
    }

    await reconcileTeamContestTotals(team_id)

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
    const { data: row, error: fetchErr } = await supabase
      .from("competitor_clients")
      .select("team_id, representative_id")
      .eq("id", clientId)
      .maybeSingle()

    if (fetchErr) {
      console.error("Error al leer cliente:", fetchErr)
      return { success: false, error: fetchErr.message }
    }

    const teamId = (row as { team_id: string | null; representative_id?: string | null } | null)?.team_id ?? null
    let reconcileId = teamId
    if (!reconcileId && (row as { representative_id?: string | null })?.representative_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", (row as { representative_id: string }).representative_id)
        .maybeSingle()
      reconcileId = (prof as { team_id: string | null } | null)?.team_id ?? null
    }

    const { error } = await supabase.from("competitor_clients").delete().eq("id", clientId)

    if (error) {
      console.error("Error al eliminar cliente de la competencia:", error)
      return { success: false, error: error.message }
    }

    await reconcileTeamContestTotals(reconcileId)

    revalidatePath("/admin/clientes")
    revalidatePath("/admin/ranking")
    revalidatePath("/admin/dashboard")
    revalidatePath("/capitan/dashboard")
    revalidatePath("/capitan/ranking")
    revalidatePath("/director-tecnico/ranking")
    revalidatePath("/ranking")
    revalidatePath("/ranking-publico")
    return { success: true, message: "Cliente de la competencia eliminado exitosamente" }
  } catch (error: any) {
    console.error("Error inesperado al eliminar cliente de la competencia:", error)
    return { success: false, error: error.message || "Error inesperado al eliminar cliente" }
  }
}

export async function updateCompetitorClient(clientId: string, formData: FormData) {
  const supabase = createServerClient()

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
  const team_id = formData.get("team_id") as string
  const representative_id = formData.get("representative_id") as string

  const area_finca_hectareas = area_finca_hectareas_str ? Number.parseFloat(area_finca_hectareas_str) : null

  try {
    const { data: prevRow, error: prevErr } = await supabase
      .from("competitor_clients")
      .select("team_id")
      .eq("id", clientId)
      .maybeSingle()

    if (prevErr) {
      console.error("Error al leer cliente:", prevErr)
      return { success: false, error: prevErr.message }
    }

    const prevTeamId = (prevRow as { team_id: string | null } | null)?.team_id ?? null

    const { error } = await supabase
      .from("competitor_clients")
      .update({
        client_name: ganadero_name, // Usar ganadero_name como client_name
        competitor_name: ganadero_name, // Usar ganadero_name como competitor_name
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
        nombre_almacen: tipo_venta === "Venta por Almacén" ? nombre_almacen : null,
        team_id,
        representative_id,
      })
      .eq("id", clientId)

    if (error) {
      console.error("Error al actualizar cliente de la competencia:", error)
      return { success: false, error: error.message }
    }

    await reconcileTeamContestTotals(prevTeamId)
    await reconcileTeamContestTotals(team_id)

    revalidatePath("/admin/clientes")
    revalidatePath("/admin/ranking")
    revalidatePath("/admin/dashboard")
    return { success: true, message: "Cliente actualizado exitosamente" }
  } catch (error: any) {
    console.error("Error inesperado al actualizar cliente de la competencia:", error)
    return { success: false, error: error.message || "Error inesperado al actualizar cliente" }
  }
}
