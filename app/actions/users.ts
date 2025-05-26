"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  try {
    const supabase = createServerClient()

    // Consulta completa para obtener todos los datos necesarios
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id, 
        email, 
        full_name, 
        role, 
        zone_id, 
        distributor_id, 
        team_id,
        has_created_team,
        zones(name),
        distributors(name, logo_url),
        teams(name)
      `)
      .order("full_name")

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return { error: error.message, data: null }
    }

    // Transformar los datos para un formato más fácil de usar
    const formattedData = data.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      zone_id: user.zone_id,
      distributor_id: user.distributor_id,
      team_id: user.team_id,
      has_created_team: user.has_created_team,
      zone_name: user.zones?.name || null,
      distributor_name: user.distributors?.name || null,
      distributor_logo: user.distributors?.logo_url || null,
      team_name: user.teams?.name || null,
    }))

    console.log(`Usuarios encontrados: ${formattedData.length}`)
    return { data: formattedData, error: null }
  } catch (error: any) {
    console.error("Error en getUsers:", error)
    return { error: error.message || "Error al obtener usuarios", data: null }
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = createServerClient()

    // Primero eliminamos el perfil
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("Error al eliminar perfil:", profileError)
      return { error: profileError.message }
    }

    // Luego eliminamos el usuario de auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error al eliminar usuario de auth:", authError)
      return { error: authError.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error en deleteUser:", error)
    return { error: error.message || "Error al eliminar usuario" }
  }
}

export async function createUser(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const role = formData.get("role") as string
    const zoneId = formData.get("zoneId") as string
    const distributorId = formData.get("distributorId") as string

    if (!email || !password || !fullName || !role) {
      return { error: "Todos los campos son obligatorios" }
    }

    const supabase = createServerClient()

    // Usar la API de administración con la clave de servicio
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    })

    if (authError) {
      console.error("Error al crear usuario:", authError)
      return { error: authError.message }
    }

    // Crear perfil
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      zone_id: zoneId || null,
      distributor_id: distributorId || null,
      has_created_team: false,
    })

    if (profileError) {
      console.error("Error al crear perfil:", profileError)
      // Intentar eliminar el usuario de auth si falla la creación del perfil
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { error: profileError.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: null, userId: authData.user.id }
  } catch (error: any) {
    console.error("Error en createUser:", error)
    return { error: error.message || "Error al crear usuario" }
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const email = formData.get("email") as string
    const fullName = formData.get("fullName") as string
    const role = formData.get("role") as string
    const zoneId = formData.get("zoneId") as string
    const distributorId = formData.get("distributorId") as string
    const password = formData.get("password") as string

    if (!email || !fullName || !role) {
      return { error: "Los campos email, nombre y rol son obligatorios" }
    }

    const supabase = createServerClient()

    // Actualizar perfil
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        email,
        full_name: fullName,
        role,
        zone_id: zoneId || null,
        distributor_id: distributorId || null,
      })
      .eq("id", userId)

    if (profileError) {
      console.error("Error al actualizar perfil:", profileError)
      return { error: profileError.message }
    }

    // Si se proporcionó una nueva contraseña, actualizarla
    if (password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
        password,
      })

      if (passwordError) {
        console.error("Error al actualizar contraseña:", passwordError)
        return { error: passwordError.message }
      }
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error en updateUser:", error)
    return { error: error.message || "Error al actualizar usuario" }
  }
}

export async function getUserById(userId: string) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id, 
        email, 
        full_name, 
        role, 
        zone_id, 
        distributor_id,
        has_created_team
      `,
      )
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error al obtener usuario:", error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en getUserById:", error)
    return { error: error.message || "Error al obtener usuario", data: null }
  }
}

export async function getZones() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.from("zones").select("id, name").order("name")

    if (error) {
      console.error("Error al obtener zonas:", error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en getZones:", error)
    return { error: error.message || "Error al obtener zonas", data: null }
  }
}

export async function getDistributors() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.from("distributors").select("id, name, logo_url").order("name")

    if (error) {
      console.error("Error al obtener distribuidores:", error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Error en getDistributors:", error)
    return { error: error.message || "Error al obtener distribuidores", data: null }
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el usuario" }
  }
}

export async function findUserByEmail(email: string) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.from("profiles").select("*").eq("email", email).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 es "no rows returned"
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || "Error al buscar el usuario" }
  }
}
