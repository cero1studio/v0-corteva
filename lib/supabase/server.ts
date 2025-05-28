import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Función para crear un cliente de Supabase para el servidor
export function createServerClient() {
  const cookieStore = cookies()

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          "x-my-custom-header": "corteva-admin",
        },
      },
    },
  )

  return supabase
}

// Alias para compatibilidad con código existente
export const createServerSupabaseClient = createServerClient

// Para compatibilidad con código existente
export const adminSupabase = createServerClient()
