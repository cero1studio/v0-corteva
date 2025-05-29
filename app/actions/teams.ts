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
  const goal = Number.parseInt(formData.get("goal") as string) || 0

  try {
    const { error } = await supabase.from("teams").insert({
      name,
      zone_id: zoneId,
      distributor_id: distributorId,
      goal,
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
      goal,
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
