"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export async function signIn(formData: FormData) {
  // NextAuth maneja el inicio de sesión a través de su API
  // Este action ya no es necesario, pero lo mantenemos por compatibilidad
  return { error: "Use NextAuth signIn en el cliente" }
}

export async function signOut() {
  // NextAuth maneja el cierre de sesión a través de su API
  // Este action ya no es necesario, pero lo mantenemos por compatibilidad
  return { error: "Use NextAuth signOut en el cliente" }
}

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

    // Obtener perfil completo
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    return {
      ...session.user,
      ...profile,
    }
  } catch (error) {
    console.error("Error en getCurrentUser:", error)
    return null
  }
}
