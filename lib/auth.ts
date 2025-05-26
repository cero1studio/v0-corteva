import { createServerClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return null
    }

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
