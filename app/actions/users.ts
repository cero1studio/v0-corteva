"use server"

import { revalidatePath } from "next/cache"

// Función principal para obtener usuarios
export async function getUsers() {
  try {
    const { adminSupabase } = await import("@/lib/supabase/server")

    console.log("Obteniendo usuarios...")

    // Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await adminSupabase
      .from("profiles")
      .select(`
        id, 
        email, 
        full_name, 
        role, 
        zone_id, 
        distributor_id, 
        team_id
      `)
      .order("full_name")

    if (profilesError) {
      console.error("Error al obtener usuarios:", profilesError)
      return { error: profilesError.message, data: null }
    }

    // Si no hay perfiles, retornar array vacío
    if (!profiles || profiles.length === 0) {
      return { data: [], error: null }
    }

    // Obtener zonas, distribuidores y equipos por separado
    const { data: zones } = await adminSupabase.from("zones").select("id, name")
    const { data: distributors } = await adminSupabase.from("distributors").select("id, name, logo_url")
    const { data: teams } = await adminSupabase.from("teams").select("id, name")

    // Crear mapas de búsqueda
    const zoneMap = zones ? zones.reduce((map, zone) => ({ ...map, [zone.id]: zone }), {}) : {}
    const distributorMap = distributors ? distributors.reduce((map, dist) => ({ ...map, [dist.id]: dist }), {}) : {}
    const teamMap = teams ? teams.reduce((map, team) => ({ ...map, [team.id]: team }), {}) : {}

    // Transformar los datos
    const formattedData = profiles.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      zone_id: user.zone_id,
      distributor_id: user.distributor_id,
      team_id: user.team_id,
      zone_name: user.zone_id && zoneMap[user.zone_id] ? zoneMap[user.zone_id].name : null,
      distributor_name:
        user.distributor_id && distributorMap[user.distributor_id] ? distributorMap[user.distributor_id].name : null,
      distributor_logo:
        user.distributor_id && distributorMap[user.distributor_id]
          ? distributorMap[user.distributor_id].logo_url
          : null,
      team_name: user.team_id && teamMap[user.team_id] ? teamMap[user.team_id].name : null,
    }))

    console.log(`Usuarios encontrados: ${formattedData.length}`)
    return { data: formattedData, error: null }
  } catch (error: any) {
    console.error("Error en getUsers:", error)
    return { error: error.message || "Error al obtener usuarios", data: null }
  }
}

// Alias para mantener consistencia
export const getAllUsers = getUsers

// Función para obtener representantes
export async function getRepresentatives() {
  try {
    const { adminSupabase } = await import("@/lib/supabase/server")

    const { data: profiles, error: profilesError } = await adminSupabase
      .from("profiles")
      .select(`
        id, 
        email, 
        full_name, 
        role, 
        team_id
      `)
      .in("role", ["Representante", "Capitan"])
      .order("full_name")

    if (profilesError) {
      console.error("Error al obtener representantes:", profilesError)
      return { error: profilesError.message, data: [] }
    }

    return { data: profiles || [], error: null }
  } catch (error: any) {
    console.error("Error en getRepresentatives:", error)
    return { error: error.message || "Error al obtener representantes", data: [] }
  }
}

// Función para obtener usuarios con formato simple
export async function getUsersSimple() {
  try {
    const result = await getUsers()
    if (result.error) {
      return { success: false, data: [], error: result.error }
    }
    return { success: true, data: result.data || [], error: null }
  } catch (error: any) {
    return { success: false, data: [], error: error.message }
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

    console.log("Iniciando creación de usuario...")
    console.log("Email:", email)
    console.log("Nombre:", fullName)
    console.log("Rol:", role)

    if (!email || !password || !fullName || !role) {
      return { error: "Todos los campos son obligatorios" }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "El formato del email no es válido" }
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres" }
    }

    const { adminSupabase } = await import("@/lib/supabase/server")

    // Verificar si el usuario ya existe en profiles
    const { data: existingProfile } = await adminSupabase.from("profiles").select("email").eq("email", email).single()

    if (existingProfile) {
      return { error: "Ya existe un usuario con este email en la base de datos" }
    }

    console.log("Creando usuario en auth...")

    // Crear usuario en auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    })

    if (authError) {
      console.error("Error al crear usuario en auth:", authError)
      return { error: `Error al crear usuario: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: "No se pudo crear el usuario en el sistema de autenticación" }
    }

    console.log("Usuario creado en auth con ID:", authData.user.id)

    // Crear perfil en la base de datos
    const profileData = {
      id: authData.user.id,
      email: email,
      full_name: fullName,
      role: role,
      zone_id: zoneId && zoneId !== "none" ? zoneId : null,
      distributor_id: distributorId && distributorId !== "none" ? distributorId : null,
    }

    console.log("Creando perfil:", profileData)

    const { error: profileError } = await adminSupabase.from("profiles").insert(profileData)

    if (profileError) {
      console.error("Error al crear perfil:", profileError)

      // Si falla la creación del perfil, eliminar el usuario de auth
      try {
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        console.log("Usuario de auth eliminado debido a error en perfil")
      } catch (cleanupError) {
        console.error("Error al limpiar usuario de auth:", cleanupError)
      }

      return { error: `Error al crear perfil: ${profileError.message}` }
    }

    console.log("Usuario creado exitosamente")
    revalidatePath("/admin/usuarios")
    return { success: true, message: "Usuario creado exitosamente", userId: authData.user.id }
  } catch (error: any) {
    console.error("Error general en createUser:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}

export async function deleteUser(userId: string) {
  try {
    const { adminSupabase } = await import("@/lib/supabase/server")

    console.log("Eliminando usuario:", userId)

    // Primero eliminamos el perfil
    const { error: profileError } = await adminSupabase.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("Error al eliminar perfil:", profileError)
      return { error: profileError.message }
    }

    // Luego eliminamos el usuario de auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error al eliminar usuario de auth:", authError)
      console.warn("Usuario eliminado de la base de datos pero no del sistema de autenticación")
    }

    revalidatePath("/admin/usuarios")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error en deleteUser:", error)
    return { error: error.message || "Error al eliminar usuario" }
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    console.log("Iniciando actualización de usuario:", userId)

    const email = formData.get("email") as string
    const fullName = formData.get("fullName") as string
    const role = formData.get("role") as string
    const zoneId = formData.get("zoneId") as string
    const distributorId = formData.get("distributorId") as string
    const password = formData.get("password") as string

    if (!email || !fullName || !role) {
      return { error: "Los campos email, nombre y rol son obligatorios" }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "El formato del email no es válido" }
    }

    // Validar contraseña si se proporciona
    if (password && password.trim() !== "" && password.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres" }
    }

    const { adminSupabase } = await import("@/lib/supabase/server")

    // Verificar si el email ya existe en otro usuario
    const { data: existingUser } = await adminSupabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .neq("id", userId)
      .single()

    if (existingUser) {
      return { error: "Ya existe otro usuario con este email" }
    }

    console.log("Actualizando perfil en base de datos...")

    // Actualizar perfil en la base de datos
    const updateData = {
      email,
      full_name: fullName,
      role,
      zone_id: zoneId === "none" || !zoneId ? null : zoneId,
      distributor_id: distributorId === "none" || !distributorId ? null : distributorId,
    }

    const { error: profileError } = await adminSupabase.from("profiles").update(updateData).eq("id", userId)

    if (profileError) {
      console.error("Error al actualizar perfil:", profileError)
      return { error: `Error al actualizar perfil: ${profileError.message}` }
    }

    console.log("Perfil actualizado exitosamente")

    // Intentar actualizar en auth
    try {
      const authUpdateData: any = {
        email: email,
        user_metadata: {
          full_name: fullName,
          role: role,
        },
      }

      // Agregar contraseña si se proporcionó
      if (password && password.trim() !== "") {
        authUpdateData.password = password
      }

      // Actualizar usuario en auth
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, authUpdateData)

      if (updateError) {
        console.error("Error al actualizar usuario en auth:", updateError)
        return {
          success: true,
          warning: `Perfil actualizado, pero no se pudo actualizar en sistema de autenticación: ${updateError.message}`,
        }
      }

      console.log("✓ Usuario actualizado en auth exitosamente")
    } catch (updateError: any) {
      console.error("Error al actualizar usuario en auth:", updateError)
      return {
        success: true,
        warning: `Perfil actualizado, pero no se pudo actualizar en sistema de autenticación: ${updateError.message}`,
      }
    }

    revalidatePath("/admin/usuarios")
    return {
      success: true,
      message: "Usuario actualizado exitosamente",
    }
  } catch (error: any) {
    console.error("Error general en updateUser:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}

export async function getUserById(userId: string) {
  try {
    const { adminSupabase } = await import("@/lib/supabase/server")

    const { data, error } = await adminSupabase
      .from("profiles")
      .select(
        `
        id, 
        email, 
        full_name, 
        role, 
        zone_id, 
        distributor_id,
        team_id
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
    const { adminSupabase } = await import("@/lib/supabase/server")

    const { data, error } = await adminSupabase.from("zones").select("id, name").order("name")

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
    const { adminSupabase } = await import("@/lib/supabase/server")

    const { data, error } = await adminSupabase.from("distributors").select("id, name, logo_url").order("name")

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
    const { adminSupabase } = await import("@/lib/supabase/server")

    const { error } = await adminSupabase.from("profiles").update(updates).eq("id", userId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al actualizar el usuario" }
  }
}

// Función de diagnóstico para verificar la configuración de Supabase
export async function testSupabaseConfig() {
  try {
    const { adminSupabase } = await import("@/lib/supabase/server")

    console.log("Verificando configuración de Supabase...")
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Configurada" : "✗ No configurada")
    console.log("Service Role Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Configurada" : "✗ No configurada")

    // Probar conexión básica
    const { data, error } = await adminSupabase.from("profiles").select("count").limit(1)

    if (error) {
      console.error("Error de conexión:", error)
      return { error: `Error de conexión: ${error.message}` }
    }

    console.log("Conexión a base de datos: ✓ Exitosa")
    return { success: true }
  } catch (error: any) {
    console.error("Error en diagnóstico:", error)
    return { error: error.message }
  }
}

export async function diagnoseUser(userId: string) {
  try {
    const { adminSupabase } = await import("@/lib/supabase/server")

    console.log("Diagnosticando usuario:", userId)

    // Verificar en profiles
    const { data: profileData, error: profileError } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    console.log("Datos en profiles:", profileData ? "✓ Encontrado" : "✗ No encontrado")
    if (profileError) console.log("Error en profiles:", profileError.message)

    // Verificar en auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.getUserById(userId)

    console.log("Datos en auth:", authData.user ? "✓ Encontrado" : "✗ No encontrado")
    if (authError) console.log("Error en auth:", authError.message)

    return {
      profile: profileData,
      auth: authData.user,
      profileError: profileError?.message,
      authError: authError?.message,
    }
  } catch (error: any) {
    console.error("Error en diagnóstico:", error)
    return { error: error.message }
  }
}

export async function findUserByEmail(email: string) {
  try {
    const { adminSupabase } = await import("@/lib/supabase/server")

    const { data, error } = await adminSupabase.from("profiles").select("*").eq("email", email).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 es "no rows returned"
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || "Error al buscar el usuario" }
  }
}
