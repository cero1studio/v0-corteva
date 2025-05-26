"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Correo electrónico y contraseña son requeridos" }
    }

    // Iniciar sesión
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error("Error de inicio de sesión:", signInError)
      return { error: "Credenciales inválidas. Por favor, verifica tu correo y contraseña." }
    }

    // Obtener el perfil del usuario
    const { data: profileData, error: profileError } = await supabase.from("profiles").select("role").single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return { error: "Error al obtener información del usuario" }
    }

    // Devolver éxito y el rol para que el cliente maneje la redirección
    return {
      success: true,
      role: profileData.role,
    }
  } catch (error: any) {
    console.error("Error de inicio de sesión:", error)
    return { error: "Error al iniciar sesión" }
  }
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function getCurrentUser() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  return {
    ...session.user,
    ...profile,
  }
}
