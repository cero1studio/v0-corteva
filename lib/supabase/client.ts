import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Use a module-level variable to ensure a single instance across all imports
let clientSupabase: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getClientSupabaseClient() {
  if (!clientSupabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("❌ Supabase environment variables are not set")
      console.error("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing")
      console.error(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
      )
      throw new Error("Supabase environment variables are not set")
    }

    clientSupabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
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
        realtime: {
          timeout: 60000, // 60 segundos
        },
      },
    )
    console.log("✅ Supabase client initialized successfully (singleton)")
  }
  return clientSupabase
}
