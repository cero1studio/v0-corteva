import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Singleton pattern para el cliente de Supabase
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase environment variables are not set")
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing")
    throw new Error("Supabase environment variables are not set")
  }

  try {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: "supabase.auth.token",
      },
      global: {
        headers: {
          "x-client-info": "corteva-sales-platform",
        },
      },
    })

    console.log("✅ Supabase client initialized successfully")
    return supabaseInstance
  } catch (error) {
    console.error("❌ Error initializing Supabase client:", error)
    throw error
  }
}

// Exportar para uso directo
export const supabase = getSupabaseClient()
