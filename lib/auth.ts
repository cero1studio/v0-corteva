import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return null
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return null
    }

    // Obtener datos adicionales del perfil si es necesario
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      ...profile,
    }
  } catch (error) {
    console.error("Error en getCurrentUser:", error)
    return null
  }
}
