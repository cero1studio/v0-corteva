import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Verificar que las variables de entorno estén disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required")
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
}

// Cliente de Supabase para uso general
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cliente de Supabase con rol de administrador para operaciones privilegiadas
export const adminSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Fallback al anon key si no hay service key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
