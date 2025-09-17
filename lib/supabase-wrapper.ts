// Wrapper que agrega cleanup SIN cambiar las consultas existentes
import { createServerClient } from "@/lib/supabase/server"
import { systemConfigCache } from "./system-config-cache"

export async function getSystemConfigCached(key: string) {
  // Primero intentar cache
  const cached = systemConfigCache.get(key)
  if (cached !== null) {
    return { data: { value: cached }, error: null }
  }

  // Si no está en cache, hacer consulta normal
  const supabase = createServerClient()
  const result = await supabase.from("system_config").select("value").eq("key", key).maybeSingle()

  // Guardar en cache si es exitoso
  if (!result.error && result.data) {
    systemConfigCache.set(key, result.data.value)
  }

  return result
}
