import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// --- env & safety checks ----------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required")
}

/**
 * In preview / development we often don’t expose the Service-Role key.
 * Fall back to the public anon key so pages can still render.
 * Only throw if **both** keys are missing.
 */
if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error("Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
}

const effectiveServiceKey = supabaseServiceKey ?? supabaseAnonKey!

// ---------------------------------------------------------------------------

// Server Component client (with cookies) stays the same
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

export const createServerSupabaseClient = createServerClient // legacy alias

// Admin client: falls back to anon key when service key is absent
export const adminSupabase = createClient<Database>(supabaseUrl, effectiveServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
