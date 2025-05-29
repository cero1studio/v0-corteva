"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function createZone(formData: FormData) {
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
  const description = formData.get("description") as string

  try {
    const { error } = await supabase.from("zones").insert({
      name,
      description,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/zonas")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al crear la zona" }
  }
}

export async function getZones() {
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

  const { data, error } = await supabase.from("zones").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error al obtener zonas:", error)
    return []
  }

  return data
}

export async function deleteZone(zoneId: string) {
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
    // Verificar si hay equipos asociados a esta zona
    const { count, error: countError } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("zone_id", zoneId)

    if (countError) {
      return { error: countError.message }
    }

    if (count && count > 0) {
      return { error: "No se puede eliminar la zona porque tiene equipos asociados" }
    }

    // Eliminar la zona
    const { error } = await supabase.from("zones").delete().eq("id", zoneId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/zonas")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar la zona" }
  }
}

// Alias para mantener consistencia con otras funciones "getAll"
export const getAllZones = getZones

// Función adicional que devuelve el formato esperado por las páginas admin
export async function getAllZonesForAdmin() {
  try {
    const zones = await getZones()
    return { success: true, data: zones, error: null }
  } catch (error: any) {
    return { success: false, data: [], error: error.message }
  }
}
