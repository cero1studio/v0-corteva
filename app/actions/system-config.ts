"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getSystemConfig(key: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("system_config").select("value").eq("key", key).maybeSingle()

    if (error) throw new Error(`Error al obtener configuración: ${error.message}`)

    return { success: true, data: data?.value }
  } catch (error: any) {
    console.error("Error en getSystemConfig:", error)
    return { success: false, error: error.message }
  }
}

export async function updateSystemConfig(key: string, value: any) {
  const supabase = createServerClient()

  try {
    // Verificar si ya existe la configuración
    const { data: existingConfig, error: checkError } = await supabase
      .from("system_config")
      .select("id")
      .eq("key", key)
      .maybeSingle()

    if (checkError) throw new Error(`Error al verificar configuración existente: ${checkError.message}`)

    let result
    if (existingConfig) {
      // Actualizar configuración existente
      result = await supabase
        .from("system_config")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)
    } else {
      // Crear nueva configuración
      result = await supabase.from("system_config").insert({
        key,
        value,
        description: `Configuración para ${key}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) throw new Error(`Error al guardar configuración: ${result.error.message}`)

    revalidatePath("/admin/configuracion")
    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error en updateSystemConfig:", error)
    return { success: false, error: error.message }
  }
}
