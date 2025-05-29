import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Crear la función del cliente
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Exportar la instancia directa que muchos archivos esperan
export const supabase = createClient()

// Mantener compatibilidad con nombres anteriores
export const createServerClient = createClient
export const getSupabaseClient = createClient

// Export por defecto
export default supabase
