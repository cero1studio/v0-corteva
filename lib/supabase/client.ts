import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { createBrowserClient } from "@supabase/ssr"

// Singleton pattern para el cliente de Supabase
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
// Usamos una variable global para asegurar que solo se cree una instancia del cliente Supabase
// let supabaseClient: ReturnType<typeof createBrowserClient> | undefined
let clientSupabase: ReturnType<typeof createBrowserClient<Database>> | undefined

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
        debug: process.env.NODE_ENV === "development",
      },
      global: {
        headers: {
          "x-client-info": "corteva-sales-platform",
        },
      },
      // Aumentar los timeouts para conexiones lentas
      realtime: {
        timeout: 60000, // 60 segundos
      },
    })

    console.log("✅ Supabase client initialized successfully")
    return supabaseInstance
  } catch (error) {
    console.error("❌ Error initializing Supabase client:", error)
    throw error
  }
}

// export function getClientSupabaseClient() {
//   if (!supabaseClient) {
//     supabaseClient = createBrowserClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     )
//   }
//   return supabaseClient
// }

export function getClientSupabaseClient() {
  if (!clientSupabase) {
    clientSupabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return clientSupabase
}

// Exportar para uso directo
export const supabase = getSupabaseClient()
