"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function getZones() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase.from("zones").select("*").order("name")

    if (error) {
      console.error("Error al obtener zonas:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error("Error al obtener zonas:", error)
    return { error: error.message || "Error al obtener zonas" }
  }
}

export async function getTeams() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("teams")
      .select(`
        *,
        zones(name)
      `)
      .order("name")

    if (error) {
      console.error("Error al obtener equipos:", error)
      return { error: error.message }
    }

    // Formatear los datos para incluir el nombre de la zona
    const formattedData = data.map((team) => ({
      ...team,
      zone_name: team.zones?.name,
    }))

    return { data: formattedData }
  } catch (error: any) {
    console.error("Error al obtener equipos:", error)
    return { error: error.message || "Error al obtener equipos" }
  }
}

export async function getProducts() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase.from("products").select("*").order("name")

    if (error) {
      console.error("Error al obtener productos:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error("Error al obtener productos:", error)
    return { error: error.message || "Error al obtener productos" }
  }
}

export async function getUsers() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        team_id,
        has_created_team
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error)
    return { error: error.message || "Error al obtener usuarios" }
  }
}
