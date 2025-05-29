import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Función para crear cliente del navegador
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Instancia directa para compatibilidad
export const supabase = createClient()

// Export por defecto
export default supabase
