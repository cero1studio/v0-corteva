"use server"

import { adminSupabase } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { revalidatePath } from "next/cache"

export async function forceChangePassword(password: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return { error: "No autorizado" }
    }

    const userId = session.user.id

    // 1. Actualizar la contraseña en auth.users
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: password,
    })

    if (authError) {
      console.error("Error al actualizar contraseña:", authError)
      return { error: authError.message }
    }

    // 2. Actualizar el flag en perfiles
    const supabase = createServerClient()
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ force_password_change: false })
      .eq("id", userId)

    if (profileError) {
      console.error("Error al actualizar el perfil:", profileError)
      return { error: "Contraseña actualizada pero hubo un error al quitar la bandera del perfil." }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error general al cambiar contraseña:", error)
    return { error: "Ocurrió un error inesperado al procesar la solicitud." }
  }
}
