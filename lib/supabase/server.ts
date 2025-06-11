// ESTE console.log DEBE APARECER SI EL MÓDULO SE CARGA
console.log("--- lib/supabase/server.ts MODULE LOADED ---")

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Función para crear un cliente de Supabase en el servidor
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Mantener la función original por compatibilidad
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Cliente de Supabase con rol de administrador para operaciones privilegiadas
// Ahora es una función para asegurar que las variables de entorno estén cargadas
export const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL")
  }
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}
