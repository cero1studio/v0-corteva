"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function createTeam(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  // Obtener datos del formulario
  const name = formData.get("name") as string
  const zoneId = formData.get("zoneId") as string
  const distributorId = formData.get("distributorId") as string
  const goals = Number.parseInt(formData.get("goals") as string) || 0

  try {
    const { error } = await supabase.from("teams").insert({
      name,
      zone_id: zoneId,
      distributor_id: distributorId,
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

// Modificar la función getTeams para que funcione sin depender de capitanes
export async function getTeams() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  // Obtener equipos con sus zonas y distribuidores
  const { data, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      goals,
      created_at,
      zones (
        id,
        name
      ),
      distributors (
        id,
        name,
        logo_url
      )
    `)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error al obtener equipos:", error)
    return []
  }

  return data
}

export async function getAllTeams() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  try {
    const { data, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        goals,
        zone_id,
        created_at,
        zones (
          id,
          name
        ),
        distributors (
          id,
          name,
          logo_url
        )
      `)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error al obtener todos los equipos:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error inesperado al obtener equipos:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteTeam(teamId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  try {
    // Verificar si hay usuarios asociados a este equipo
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)

    if (countError) {
      return { error: countError.message }
    }

    if (count && count > 0) {
      return { error: "No se puede eliminar el equipo porque tiene usuarios asociados" }
    }

    // Eliminar el equipo
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

// Alias para mantener consistencia con otras funciones "getAll"
export const getAllTeamsForAdmin = getAllTeams

// Función adicional para obtener equipos con formato simple
export async function getTeamsSimple() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  const { data, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      zone_id,
      zones (
        id,
        name
      )
    `)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error al obtener equipos:", error)
    return []
  }

  return data || []
}
