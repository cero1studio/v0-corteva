import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Singleton pattern para el cliente de Supabase
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are not set")
    throw new Error("Supabase environment variables are not set")
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "supabase.auth.token",
    },
  })

  return supabaseInstance
}

// Exportar para uso directo
export const supabase = getSupabaseClient()
