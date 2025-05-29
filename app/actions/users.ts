"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Alias de getUsers para mantener consistencia con otras funciones "getAll"
export const getAllUsers = getUsers

// Agregar después de la línea donde se define getAllUsers:

// Función adicional para obtener usuarios simples (solo representantes)
export async function getRepresentatives() {
  try {
    const supabase = createServerClient()

    const { data: profiles, error: profilesError } = await supabase
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

// Replace the getUsers function with this updated version that uses explicit joins
export async function getUsers() {
  try {
    const supabase = createServerClient()

    // First, get all profiles
    const { data: profiles, error: profilesError } = await supabase
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

    // If no profiles found, return empty array
    if (!profiles || profiles.length === 0) {
      return { data: [], error: null }
    }

    // Get all zones, distributors, and teams in separate queries
    const { data: zones } = await supabase.from("zones").select("id, name")
    const { data: distributors } = await supabase.from("distributors").select("id, name, logo_url")
    const { data: teams } = await supabase.from("teams").select("id, name")

    // Create lookup maps for faster access
    const zoneMap = zones ? zones.reduce((map, zone) => ({ ...map, [zone.id]: zone }), {}) : {}
    const distributorMap = distributors ? distributors.reduce((map, dist) => ({ ...map, [dist.id]: dist }), {}) : {}
    const teamMap = teams ? teams.reduce((map, team) => ({ ...map, [team.id]: team }), {}) : {}

    // Transform the data by manually joining with the lookup maps
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

// Función de diagnóstico para verificar la configuración de Supabase
export async function testSupabaseConfig() {
  try {
    const supabase = createServerClient()

    console.log("Verificando configuración de Supabase...")
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Configurada" : "✗ No configurada")
    console.log("Service Role Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Configurada" : "✗ No configurada")

    // Probar conexión básica
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

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

    const supabase = createServerClient()

    // Verificar si el usuario ya existe en profiles
    const { data: existingProfile } = await supabase.from("profiles").select("email").eq("email", email).single()

    if (existingProfile) {
      return { error: "Ya existe un usuario con este email en la base de datos" }
    }

    // Verificar si el email ya existe en auth
    console.log("Verificando si el email existe en auth...")
    const { user: existingAuthUser, error: findError } = await findAuthUserByEmail(supabase, email)

    if (findError) {
      console.warn("Error al verificar email en auth:", findError)
      // Continuar con la creación, pero con advertencia
    }

    if (existingAuthUser) {
      console.log("Email ya existe en auth con ID:", existingAuthUser.id)

      // El email ya existe en auth, crear solo el perfil con el ID existente
      const profileData = {
        id: existingAuthUser.id,
        email: email,
        full_name: fullName,
        role: role,
        zone_id: zoneId && zoneId !== "none" ? zoneId : null,
        distributor_id: distributorId && distributorId !== "none" ? distributorId : null,
      }

      console.log("Creando perfil con ID existente:", profileData)

      const { error: profileError } = await supabase.from("profiles").insert(profileData)

      if (profileError) {
        console.error("Error al crear perfil:", profileError)
        return { error: `Error al crear perfil: ${profileError.message}` }
      }

      // Actualizar los datos del usuario en auth
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
          user_metadata: {
            full_name: fullName,
            role: role,
          },
        })

        if (updateError) {
          console.warn("No se pudo actualizar metadata en auth:", updateError.message)
        }
      } catch (updateError) {
        console.warn("Error al actualizar metadata:", updateError)
      }

      console.log("Usuario creado exitosamente usando cuenta de auth existente")
      revalidatePath("/admin/usuarios")
      return {
        success: true,
        message: "Usuario creado exitosamente usando cuenta de autenticación existente",
        userId: existingAuthUser.id,
      }
    }

    // El email no existe en auth, intentar crear nuevo usuario
    console.log("Email no existe en auth, intentando crear nuevo usuario...")

    try {
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

        // Si falla la creación en auth, crear solo el perfil con un ID generado
        console.log("Creando perfil sin auth debido a error...")

        const generatedId = crypto.randomUUID()
        const profileData = {
          id: generatedId,
          email: email,
          full_name: fullName,
          role: role,
          zone_id: zoneId && zoneId !== "none" ? zoneId : null,
          distributor_id: distributorId && distributorId !== "none" ? distributorId : null,
        }

        const { error: profileError } = await supabase.from("profiles").insert(profileData)

        if (profileError) {
          console.error("Error al crear perfil:", profileError)
          return { error: `Error al crear perfil: ${profileError.message}` }
        }

        console.log("Perfil creado sin auth")
        revalidatePath("/admin/usuarios")
        return {
          success: true,
          warning: `Usuario creado en base de datos, pero no se pudo crear en sistema de autenticación: ${authError.message}. Use 'Sincronizar Usuarios' para completar el proceso.`,
          userId: generatedId,
          needsSync: true,
        }
      }

      if (!authData.user) {
        // Si no hay error pero tampoco usuario, crear solo el perfil
        console.log("No se obtuvo usuario de auth, creando solo perfil...")

        const generatedId = crypto.randomUUID()
        const profileData = {
          id: generatedId,
          email: email,
          full_name: fullName,
          role: role,
          zone_id: zoneId && zoneId !== "none" ? zoneId : null,
          distributor_id: distributorId && distributorId !== "none" ? distributorId : null,
        }

        const { error: profileError } = await supabase.from("profiles").insert(profileData)

        if (profileError) {
          console.error("Error al crear perfil:", profileError)
          return { error: `Error al crear perfil: ${profileError.message}` }
        }

        console.log("Perfil creado sin auth (no user returned)")
        revalidatePath("/admin/usuarios")
        return {
          success: true,
          warning:
            "Usuario creado en base de datos, pero no se pudo crear en sistema de autenticación. Use 'Sincronizar Usuarios' para completar el proceso.",
          userId: generatedId,
          needsSync: true,
        }
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

      const { error: profileError } = await supabase.from("profiles").insert(profileData)

      if (profileError) {
        console.error("Error al crear perfil:", profileError)

        // Si falla la creación del perfil, eliminar el usuario de auth
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
          console.log("Usuario de auth eliminado debido a error en perfil")
        } catch (cleanupError) {
          console.error("Error al limpiar usuario de auth:", cleanupError)
        }

        return { error: `Error al crear perfil: ${profileError.message}` }
      }

      console.log("Usuario creado exitosamente")
      revalidatePath("/admin/usuarios")
      return { success: true, message: "Usuario creado exitosamente", userId: authData.user.id }
    } catch (createError: any) {
      console.error("Error en creación de auth:", createError)

      // Si hay cualquier error en la creación de auth, crear solo el perfil
      console.log("Creando perfil sin auth debido a excepción...")

      const generatedId = crypto.randomUUID()
      const profileData = {
        id: generatedId,
        email: email,
        full_name: fullName,
        role: role,
        zone_id: zoneId && zoneId !== "none" ? zoneId : null,
        distributor_id: distributorId && distributorId !== "none" ? distributorId : null,
      }

      const { error: profileError } = await supabase.from("profiles").insert(profileData)

      if (profileError) {
        console.error("Error al crear perfil:", profileError)
        return { error: `Error al crear perfil: ${profileError.message}` }
      }

      console.log("Perfil creado sin auth (excepción)")
      revalidatePath("/admin/usuarios")
      return {
        success: true,
        warning: `Usuario creado en base de datos, pero no se pudo crear en sistema de autenticación: ${createError.message}. Use 'Sincronizar Usuarios' para completar el proceso.`,
        userId: generatedId,
        needsSync: true,
      }
    }
  } catch (error: any) {
    console.error("Error general en createUser:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}

// Función auxiliar para buscar usuario por email en auth
async function findAuthUserByEmail(supabase: any, email: string) {
  try {
    // Intentar obtener el usuario por email usando la API admin
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Error al listar usuarios:", error)
      return { user: null, error: error.message }
    }

    const user = data.users?.find((u: any) => u.email === email)
    return { user: user || null, error: null }
  } catch (error: any) {
    console.error("Error en findAuthUserByEmail:", error)
    return { user: null, error: error.message }
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

    console.log("Datos a actualizar:", {
      email,
      fullName,
      role,
      zoneId,
      distributorId,
      hasPassword: !!password,
    })

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

    const supabase = createServerClient()

    // Verificar si el email ya existe en otro usuario
    const { data: existingUser } = await supabase
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

    const { error: profileError } = await supabase.from("profiles").update(updateData).eq("id", userId)

    if (profileError) {
      console.error("Error al actualizar perfil:", profileError)
      return { error: `Error al actualizar perfil: ${profileError.message}` }
    }

    console.log("Perfil actualizado exitosamente")

    // SINCRONIZACIÓN AUTOMÁTICA CON AUTH - ENFOQUE SEGURO
    console.log("Verificando existencia en sistema de autenticación...")

    // Verificar si el usuario existe en auth por ID
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(userId)

    // Si el usuario existe en auth, intentar actualizar
    if (!getUserError && authUser.user) {
      console.log("Usuario SÍ existe en auth, actualizando...")

      try {
        // Preparar datos de actualización
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
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, authUpdateData)

        if (updateError) {
          console.error("Error al actualizar usuario en auth:", updateError)
          return {
            success: true,
            warning: `Perfil actualizado, pero no se pudo actualizar en sistema de autenticación: ${updateError.message}`,
          }
        }

        console.log("✓ Usuario actualizado en auth exitosamente")
        revalidatePath("/admin/usuarios")
        return {
          success: true,
          message: "Usuario actualizado exitosamente en base de datos y sistema de autenticación",
        }
      } catch (updateError: any) {
        console.error("Error al actualizar usuario en auth:", updateError)
        return {
          success: true,
          warning: `Perfil actualizado, pero no se pudo actualizar en sistema de autenticación: ${updateError.message}`,
        }
      }
    } else {
      // El usuario no existe en auth o hubo un error al verificar
      console.log("Usuario NO existe en auth o hubo un error al verificar")

      // Devolver éxito pero con advertencia
      revalidatePath("/admin/usuarios")
      return {
        success: true,
        warning:
          "Perfil actualizado correctamente, pero no se pudo sincronizar con el sistema de autenticación. Use la función 'Sincronizar Usuarios' para completar el proceso.",
      }
    }
  } catch (error: any) {
    console.error("Error general en updateUser:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}

// Nueva función para sincronizar un usuario específico con auth
export async function syncUserWithAuth(
  userId: string,
  email: string,
  fullName: string,
  role: string,
  password?: string,
) {
  try {
    const supabase = createServerClient()

    console.log("Sincronizando usuario con auth:", userId)

    // Verificar si el usuario existe en auth por ID
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(userId)

    if (getUserError || !authUser.user) {
      console.log("Usuario no encontrado en auth por ID, verificando por email...")

      // Verificar si existe un usuario con este email en auth
      const { user: existingAuthUser, error: findError } = await findAuthUserByEmail(supabase, email)

      if (findError) {
        console.warn("Error al buscar usuario por email:", findError)
        // Continuar con la creación, pero con advertencia
      }

      if (existingAuthUser) {
        console.log("Usuario encontrado en auth con email pero diferente ID:", existingAuthUser.id)

        // El email ya existe en auth pero con diferente ID
        // Actualizar el perfil para usar el ID correcto
        try {
          const { error: updateIdError } = await supabase
            .from("profiles")
            .update({ id: existingAuthUser.id })
            .eq("id", userId)

          if (updateIdError) {
            console.error("Error al actualizar ID del perfil:", updateIdError)
            return { error: "Error al sincronizar con usuario existente en autenticación" }
          }

          // Actualizar los datos del usuario en auth
          const authUpdateData: any = {
            user_metadata: {
              full_name: fullName,
              role: role,
            },
          }

          if (password && password.trim() !== "") {
            authUpdateData.password = password
          }

          const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
            existingAuthUser.id,
            authUpdateData,
          )

          if (updateAuthError) {
            console.warn("Error al actualizar usuario en auth:", updateAuthError)
            // No es un error crítico, continuamos
          }

          console.log("✓ Usuario sincronizado con auth existente")
          return {
            success: true,
            message: "Usuario sincronizado con cuenta de autenticación existente",
            newId: existingAuthUser.id,
            updated: true,
          }
        } catch (syncError: any) {
          console.error("Error al sincronizar con usuario existente:", syncError)
          return { error: `Error al sincronizar: ${syncError.message}` }
        }
      }

      // No existe en auth, intentar crear nuevo
      console.log("Usuario no existe en auth, creando nuevo...")

      // Generar contraseña temporal si no se proporciona
      const tempPassword = password || `temp${Math.random().toString(36).slice(-8)}!`

      try {
        // Crear usuario en auth
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: role,
          },
        })

        if (createError) {
          console.error("Error al crear usuario en auth:", createError)

          // Si falla la creación, devolver éxito parcial
          return {
            partialSuccess: true,
            error: `Error al crear en auth: ${createError.message}`,
            message: "No se pudo crear en auth, pero el perfil existe en la base de datos",
          }
        }

        if (!newAuthUser.user) {
          return {
            partialSuccess: true,
            error: "No se obtuvo usuario de auth",
            message: "No se pudo crear en auth, pero el perfil existe en la base de datos",
          }
        }

        // Si se creó con un ID diferente, actualizar el perfil
        if (newAuthUser.user.id !== userId) {
          console.log("Usuario creado con nuevo ID, actualizando perfil...")

          const { error: updateIdError } = await supabase
            .from("profiles")
            .update({ id: newAuthUser.user.id })
            .eq("id", userId)

          if (updateIdError) {
            console.error("Error al actualizar ID del perfil:", updateIdError)

            // Limpiar el usuario creado en auth
            try {
              await supabase.auth.admin.deleteUser(newAuthUser.user.id)
            } catch (cleanupError) {
              console.error("Error al limpiar usuario de auth:", cleanupError)
            }

            return {
              partialSuccess: true,
              error: "Error al sincronizar ID",
              message: "No se pudo actualizar el ID en la base de datos",
            }
          }

          return { success: true, newId: newAuthUser.user.id, created: true, tempPassword }
        }

        return { success: true, created: true, tempPassword }
      } catch (createError: any) {
        console.error("Error en creación de auth:", createError)
        return {
          partialSuccess: true,
          error: createError.message,
          message: "Error al crear en auth, pero el perfil existe en la base de datos",
        }
      }
    } else {
      console.log("Usuario encontrado en auth, actualizando...")

      // Actualizar usuario existente
      const updateData: any = {
        email: email,
        user_metadata: {
          full_name: fullName,
          role: role,
        },
      }

      if (password && password.trim() !== "") {
        if (password.length < 6) {
          return { error: "La contraseña debe tener al menos 6 caracteres" }
        }
        updateData.password = password
      }

      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, updateData)

        if (updateError) {
          console.error("Error al actualizar usuario en auth:", updateError)
          return {
            partialSuccess: true,
            error: `Error al actualizar en auth: ${updateError.message}`,
            message: "No se pudo actualizar en auth, pero el perfil existe en la base de datos",
          }
        }

        return { success: true, updated: true }
      } catch (updateError: any) {
        console.error("Error al actualizar usuario en auth:", updateError)
        return {
          partialSuccess: true,
          error: updateError.message,
          message: "Error al actualizar en auth, pero el perfil existe en la base de datos",
        }
      }
    }
  } catch (error: any) {
    console.error("Error en syncUserWithAuth:", error)
    return {
      partialSuccess: true,
      error: error.message,
      message: "Error general en sincronización, pero el perfil existe en la base de datos",
    }
  }
}

// Función principal para sincronizar todos los usuarios
export async function syncAllUsersWithAuth() {
  try {
    console.log("Iniciando sincronización masiva de usuarios...")

    const supabase = createServerClient()

    // Obtener todos los usuarios de profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("email")

    if (profilesError) {
      console.error("Error al obtener perfiles:", profilesError)
      return { error: `Error al obtener perfiles: ${profilesError.message}` }
    }

    if (!profiles || profiles.length === 0) {
      return {
        success: true,
        message: "No hay usuarios para sincronizar",
        stats: { total: 0, created: 0, errors: 0 },
      }
    }

    console.log(`Encontrados ${profiles.length} usuarios para sincronizar`)

    const stats = {
      total: profiles.length,
      created: 0,
      updated: 0,
      errors: 0,
      skipped: 0,
      partial: 0,
    }

    const errors: string[] = []
    const results: any[] = []

    // Procesar cada usuario
    for (const profile of profiles) {
      try {
        console.log(`Procesando: ${profile.email}`)

        // Generar contraseña temporal
        const tempPassword = `temp${Math.random().toString(36).slice(-8)}!`

        const syncResult = await syncUserWithAuth(
          profile.id,
          profile.email,
          profile.full_name,
          profile.role,
          tempPassword,
        )

        if (syncResult.error && !syncResult.partialSuccess) {
          console.error(`Error al sincronizar ${profile.email}:`, syncResult.error)
          errors.push(`${profile.email}: ${syncResult.error}`)
          stats.errors++
        } else if (syncResult.partialSuccess) {
          console.warn(`Sincronización parcial para ${profile.email}:`, syncResult.message)
          stats.partial++
          results.push({
            email: profile.email,
            action: "partial",
            message: syncResult.message,
            error: syncResult.error,
          })
        } else if (syncResult.created) {
          console.log(`✓ Creado en auth: ${profile.email}`)
          stats.created++
          results.push({
            email: profile.email,
            action: "created",
            newId: syncResult.newId,
            tempPassword: syncResult.tempPassword,
          })
        } else if (syncResult.updated) {
          console.log(`✓ Actualizado en auth: ${profile.email}`)
          stats.updated++
          results.push({
            email: profile.email,
            action: "updated",
          })
        } else {
          console.log(`- Sin cambios: ${profile.email}`)
          stats.skipped++
          results.push({
            email: profile.email,
            action: "skipped",
          })
        }

        // Pequeña pausa para evitar sobrecargar la API
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error: any) {
        console.error(`Error procesando ${profile.email}:`, error)
        errors.push(`${profile.email}: ${error.message}`)
        stats.errors++
      }
    }

    console.log("Sincronización completada:", stats)

    revalidatePath("/admin/usuarios")

    return {
      success: true,
      message: `Sincronización completada: ${stats.created} creados, ${stats.updated} actualizados, ${stats.partial} parciales, ${stats.errors} errores`,
      stats,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error("Error general en sincronización:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}

// Nueva función para migrar todos los emails de @superganaderia.com a @llevolasriendas.com
export async function migrateEmailDomains() {
  try {
    console.log("Iniciando migración de dominios de email...")

    const supabase = createServerClient()

    // Obtener todos los usuarios con emails @superganaderia.com
    const { data: users, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .like("email", "%@superganaderia.com")

    if (fetchError) {
      console.error("Error al obtener usuarios:", fetchError)
      return { error: `Error al obtener usuarios: ${fetchError.message}` }
    }

    if (!users || users.length === 0) {
      console.log("No se encontraron usuarios con dominio @superganaderia.com")
      return { success: true, message: "No hay usuarios para migrar", updated: 0 }
    }

    console.log(`Encontrados ${users.length} usuarios para migrar`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Migrar cada usuario
    for (const user of users) {
      try {
        const oldEmail = user.email
        const newEmail = oldEmail.replace("@superganaderia.com", "@llevolasriendas.com")

        console.log(`Migrando: ${oldEmail} → ${newEmail}`)

        // Actualizar en la base de datos
        const { error: profileError } = await supabase.from("profiles").update({ email: newEmail }).eq("id", user.id)

        if (profileError) {
          console.error(`Error al actualizar perfil de ${oldEmail}:`, profileError)
          errors.push(`${oldEmail}: ${profileError.message}`)
          errorCount++
          continue
        }

        // Actualizar en auth
        try {
          const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
            email: newEmail,
          })

          if (authError) {
            console.warn(`No se pudo actualizar email en auth para ${oldEmail}:`, authError.message)
            // No contamos esto como error crítico, el perfil ya se actualizó
          }
        } catch (authError) {
          console.warn(`Error en auth para ${oldEmail}:`, authError)
        }

        console.log(`✓ Migrado exitosamente: ${oldEmail} → ${newEmail}`)
        successCount++

        // Pequeña pausa para evitar sobrecargar la API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`Error al migrar ${user.email}:`, error)
        errors.push(`${user.email}: ${error.message}`)
        errorCount++
      }
    }

    console.log(`Migración completada: ${successCount} exitosos, ${errorCount} errores`)

    revalidatePath("/admin/usuarios")

    return {
      success: true,
      message: `Migración completada: ${successCount} usuarios actualizados`,
      updated: successCount,
      errors: errorCount > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error("Error general en migración:", error)
    return { error: `Error inesperado: ${error.message}` }
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

export async function diagnoseUser(userId: string) {
  try {
    const supabase = createServerClient()

    console.log("Diagnosticando usuario:", userId)

    // Verificar en profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    console.log("Datos en profiles:", profileData ? "✓ Encontrado" : "✗ No encontrado")
    if (profileError) console.log("Error en profiles:", profileError.message)

    // Verificar en auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId)

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

// --- Funciones para Reset e Importación de Usuarios ---

export async function deleteAllUsers() {
  try {
    const supabase = createServerClient()
    console.log("Iniciando eliminación de todos los usuarios...")

    // Obtener todos los usuarios excepto el admin
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .neq("email", "admin@admin.com") // Excluir al admin

    if (profilesError) {
      console.error("Error al obtener la lista de usuarios:", profilesError)
      return { error: `Error al obtener la lista de usuarios: ${profilesError.message}` }
    }

    if (!profiles || profiles.length === 0) {
      console.log("No hay usuarios para eliminar.")
      return { success: true, message: "No hay usuarios para eliminar." }
    }

    console.log(`Encontrados ${profiles.length} usuarios para eliminar.`)

    let deletedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Eliminar cada usuario
    for (const profile of profiles) {
      try {
        console.log(`Eliminando usuario: ${profile.email}`)

        // Eliminar el perfil
        const { error: profileDeleteError } = await supabase.from("profiles").delete().eq("id", profile.id)

        if (profileDeleteError) {
          console.error(`Error al eliminar el perfil de ${profile.email}:`, profileDeleteError)
          errors.push(`${profile.email}: ${profileDeleteError.message}`)
          errorCount++
          continue
        }

        // Eliminar el usuario de auth
        try {
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(profile.id)

          if (authDeleteError) {
            console.warn(`No se pudo eliminar el usuario de auth ${profile.email}:`, authDeleteError.message)
            // No contamos esto como un error crítico, ya que el perfil se eliminó
          }
        } catch (authError: any) {
          console.warn(`Error al eliminar usuario de auth ${profile.email}:`, authError)
        }

        console.log(`✓ Eliminado exitosamente: ${profile.email}`)
        deletedCount++

        // Pequeña pausa para evitar sobrecargar la API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`Error al eliminar ${profile.email}:`, error)
        errors.push(`${profile.email}: ${error.message}`)
        errorCount++
      }
    }

    console.log(`Eliminación completada: ${deletedCount} exitosos, ${errorCount} errores.`)

    revalidatePath("/admin/usuarios")

    return {
      success: true,
      message: `Eliminación completada: ${deletedCount} usuarios eliminados.`,
      deleted: deletedCount,
      errors: errorCount > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error("Error general en la eliminación:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}

export async function importUsersFromList() {
  try {
    const supabase = createServerClient()
    console.log("Iniciando importación de usuarios desde la lista...")

    // Lista de usuarios a importar (reemplaza con tu lista real)
    const usersToImport = [
      {
        email: "juan.perez@llevolasriendas.com",
        password: "Password123!",
        full_name: "Juan Perez",
        role: "Capitan",
        zone_id: "f6c8c1f0-e3b0-4a0a-9d1a-5e3b0b0b0b0b", // Antioquia
        distributor_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef", // Agralba Antioquia
      },
      {
        email: "maria.gomez@llevolasriendas.com",
        password: "SecurePass456!",
        full_name: "Maria Gomez",
        role: "Director Tecnico",
        zone_id: "1a2b3c4d-5e6f-7890-1234-567890abcdef", // Mag. Medio
        distributor_id: "fedcba98-7654-3210-fedc-ba9876543210", // Agralba Santander
      },
      {
        email: "carlos.rodriguez@llevolasriendas.com",
        password: "StrongPwd789!",
        full_name: "Carlos Rodriguez",
        role: "Capitan",
        zone_id: "9d8c7b6a-5f4e-3d2c-1b0a-999999999999", // Santander
        distributor_id: "12345678-90ab-cdef-1234-567890abcdef", // Cosechar
      },
      {
        email: "laura.martinez@llevolasriendas.com",
        password: "SafeWord101!",
        full_name: "Laura Martinez",
        role: "Director Tecnico",
        zone_id: "4e5f6g7h-8i9j-0k1l-2m3n-4o5p6q7r8s9t", // Caribe Húmedo
        distributor_id: "abcdef01-2345-6789-abcd-ef0123456789", // Insagrin
      },
      {
        email: "pedro.sanchez@llevolasriendas.com",
        password: "Passphrase202!",
        full_name: "Pedro Sanchez",
        role: "Capitan",
        zone_id: "b1c2d3e4-f5a6-9876-5432-10abcdef9876", // Caribe Seco
        distributor_id: "98765432-10ab-cdef-9876-543210abcdef", // Agralba Antioquia
      },
      {
        email: "ana.lopez@llevolasriendas.com",
        password: "KeySecret303!",
        full_name: "Ana Lopez",
        role: "Director Tecnico",
        zone_id: "c6d7e8f9-a0b1-2c3d-4e5f-67890abcdef01", // Casanare
        distributor_id: "23456789-0abc-def1-2345-67890abcdef0", // Agralba Santander
      },
      {
        email: "diego.fernandez@llevolasriendas.com",
        password: "CodeAccess404!",
        full_name: "Diego Fernandez",
        role: "Capitan",
        zone_id: "d1e2f3a4-b5c6-7d8e-9f0a-bcdef0123456", // Meta
        distributor_id: "34567890-abcd-ef12-3456-7890abcdef12", // Cosechar
      },
      {
        email: "sofia.gutierrez@llevolasriendas.com",
        password: "WordPass505!",
        full_name: "Sofia Gutierrez",
        role: "Director Tecnico",
        zone_id: "e6f7a8b9-c0d1-2e3f-4a5b-67890abcdef01", // Eje y Valle
        distributor_id: "4567890a-bcde-f123-4567-890abcdef123", // Insagrin
      },
      {
        email: "luis.gonzalez@llevolasriendas.com",
        password: "PassKey606!",
        full_name: "Luis Gonzalez",
        role: "Capitan",
        zone_id: "f1a2b3c4-d5e6-7f8a-9b0c-def012345678", // Colombia
        distributor_id: "567890ab-cdef-1234-5678-90abcdef1234", // Agralba Antioquia
      },
      {
        email: "isabela.ramirez@llevolasriendas.com",
        password: "SecretCode707!",
        full_name: "Isabela Ramirez",
        role: "Director Tecnico",
        zone_id: "a7b8c9d0-e1f2-3a4b-5c6d-ef0123456789", // Antioquia
        distributor_id: "67890abc-def1-2345-6789-0abcdef12345", // Agralba Santander
      },
      {
        email: "martin.flores@llevolasriendas.com",
        password: "AccessGranted808!",
        full_name: "Martin Flores",
        role: "Capitan",
        zone_id: "b2c3d4e5-f6a7-4b8c-9d0e-f0123456789a", // Mag. Medio
        distributor_id: "7890abcd-ef12-3456-7890-abcdef123456", // Cosechar
      },
      {
        email: "valeria.jimenez@llevolasriendas.com",
        password: "OpenSesame909!",
        full_name: "Valeria Jimenez",
        role: "Director Tecnico",
        zone_id: "c7d8e9f0-a1b2-5c3d-6e4f-0123456789ab", // Santander
        distributor_id: "890abcdef-1234-5678-90ab-cdef12345678", // Insagrin
      },
      {
        email: "andres.castillo@llevolasriendas.com",
        password: "KeyAccess111!",
        full_name: "Andres Castillo",
        role: "Capitan",
        zone_id: "d2e3f4a5-b6c7-6d8e-9f0a-123456789abc", // Caribe Húmedo
        distributor_id: "90abcdef1-2345-6789-0abc-def123456789", // Agralba Antioquia
      },
      {
        email: "ximena.ortiz@llevolasriendas.com",
        password: "Passcode222!",
        full_name: "Ximena Ortiz",
        role: "Director Tecnico",
        zone_id: "e7f8a9b0-c1d2-7e3f-8a4b-23456789abcd", // Caribe Seco
        distributor_id: "0abcdef12-3456-7890-abcd-ef123456789a", // Agralba Santander
      },
      {
        email: "roberto.silva@llevolasriendas.com",
        password: "SecretPass333!",
        full_name: "Roberto Silva",
        role: "Capitan",
        zone_id: "f2a3b4c5-d6e7-8f9a-0b1c-3456789abcde", // Casanare
        distributor_id: "abcdef123-4567-890a-bcde-f123456789ab", // Cosechar
      },
      {
        email: "carolina.perez@llevolasriendas.com",
        password: "CodeWord444!",
        full_name: "Carolina Perez",
        role: "Director Tecnico",
        zone_id: "a8b9c0d1-e2f3-9a4b-5c6d-456789abcdef0", // Meta
        distributor_id: "bcdef1234-5678-90ab-cdef-123456789abc", // Insagrin
      },
      {
        email: "fernando.gomez@llevolasriendas.com",
        password: "AccessKey555!",
        full_name: "Fernando Gomez",
        role: "Capitan",
        zone_id: "b3c4d5e6-f7a8-0b9c-1d2e-56789abcdef01", // Eje y Valle
        distributor_id: "cdef12345-6789-0abc-def1-23456789abcd", // Agralba Antioquia
      },
      {
        email: "gabriela.rodriguez@llevolasriendas.com",
        password: "PassAccess666!",
        full_name: "Gabriela Rodriguez",
        role: "Director Tecnico",
        zone_id: "c8d9e0f1-a2b3-1c4d-5e6f-6789abcdef012", // Colombia
        distributor_id: "def123456-7890-abcd-ef12-3456789abcde", // Agralba Santander
      },
      {
        email: "hector.martinez@llevolasriendas.com",
        password: "SecretCode777!",
        full_name: "Hector Martinez",
        role: "Capitan",
        zone_id: "d3e4f5a6-b7c8-2d9e-3f0a-789abcdef0123", // Antioquia
        distributor_id: "ef1234567-890a-bcde-f123-456789abcdef", // Cosechar
      },
      {
        email: "lorena.sanchez@llevolasriendas.com",
        password: "CodePass888!",
        full_name: "Lorena Sanchez",
        role: "Director Tecnico",
        zone_id: "e8f9a0b1-c2d3-3e4f-5a6b-89abcdef01234", // Mag. Medio
        distributor_id: "f12345678-90ab-cdef-1234-56789abcdef0", // Insagrin
      },
      {
        email: "ignacio.lopez@llevolasriendas.com",
        password: "AccessWord999!",
        full_name: "Ignacio Lopez",
        role: "Capitan",
        zone_id: "f3a4b5c6-d7e8-4f9a-5b0c-9abcdef012345", // Santander
        distributor_id: "123456789-0abc-def1-2345-67890abcdef1", // Agralba Antioquia
      },
      {
        email: "constanza.fernandez@llevolasriendas.com",
        password: "PassKey000!",
        full_name: "Constanza Fernandez",
        role: "Director Tecnico",
        zone_id: "a9b0c1d2-e3f4-5a6b-7c8d-abcdef0123456", // Caribe Húmedo
        distributor_id: "234567890-abcd-ef12-3456-7890abcdef12", // Agralba Santander
      },
      {
        email: "damian.gutierrez@llevolasriendas.com",
        password: "SecretAccess101!",
        full_name: "Damian Gutierrez",
        role: "Capitan",
        zone_id: "b4c5d6e7-f8a9-6b7c-8d9e-bcdef01234567", // Caribe Seco
        distributor_id: "34567890a-bcde-f123-4567-890abcdef123", // Cosechar
      },
      {
        email: "elena.gonzalez@llevolasriendas.com",
        password: "CodeSecret202!",
        full_name: "Elena Gonzalez",
        role: "Director Tecnico",
        zone_id: "c9d0e1f2-a3b4-7c5d-9e6f-cdef012345678", // Casanare
        distributor_id: "4567890ab-cdef-1234-5678-90abcdef1234", // Insagrin
      },
      {
        email: "federico.ramirez@llevolasriendas.com",
        password: "AccessCode303!",
        full_name: "Federico Ramirez",
        role: "Capitan",
        zone_id: "d4e5f6a7-b8c9-8d7e-9f0a-def0123456789", // Meta
        distributor_id: "567890abc-def1-2345-6789-0abcdef12345", // Agralba Antioquia
      },
      {
        email: "gimena.flores@llevolasriendas.com",
        password: "PassWord404!",
        full_name: "Gimena Flores",
        role: "Director Tecnico",
        zone_id: "e9f0a1b2-c3d4-9e5f-0a6b-ef0123456789a", // Eje y Valle
        distributor_id: "67890abcd-ef12-3456-7890-abcdef123456", // Agralba Santander
      },
      {
        email: "hugo.jimenez@llevolasriendas.com",
        password: "SecretPass505!",
        full_name: "Hugo Jimenez",
        role: "Capitan",
        zone_id: "f4a5b6c7-d8e9-0f1a-2b3c-f0123456789ab", // Colombia
        distributor_id: "7890abcdef-1234-5678-90ab-cdef12345678", // Cosechar
      },
      {
        email: "ines.castillo@llevolasriendas.com",
        password: "CodeKey606!",
        full_name: "Ines Castillo",
        role: "Director Tecnico",
        zone_id: "a0b1c2d3-e4f5-1a6b-3c7d-0123456789abc", // Antioquia
        distributor_id: "890abcdef1-2345-6789-0abc-def123456789", // Insagrin
      },
      {
        email: "javier.ortiz@llevolasriendas.com",
        password: "AccessCode707!",
        full_name: "Javier Ortiz",
        role: "Capitan",
        zone_id: "b5c6d7e8-f9a0-2b8c-4d9e-123456789abcd", // Mag. Medio
        distributor_id: "90abcdef12-3456-7890-abcd-ef123456789a", // Agralba Antioquia
      },
      {
        email: "karina.silva@llevolasriendas.com",
        password: "PassAccess808!",
        full_name: "Karina Silva",
        role: "Director Tecnico",
        zone_id: "c0d1e2f3-a4b5-3c4d-5e6f-23456789abcde", // Santander
        distributor_id: "0abcdef123-4567-890a-bcde-f123456789ab", // Agralba Santander
      },
      {
        email: "leonardo.perez@llevolasriendas.com",
        password: "SecretWord909!",
        full_name: "Leonardo Perez",
        role: "Capitan",
        zone_id: "d5e6f7a8-b9c0-4d5e-6f7a-3456789abcdef", // Caribe Húmedo
        distributor_id: "abcdef1234-5678-90ab-cdef-123456789abc", // Insagrin
      },
      {
        email: "micaela.gomez@llevolasriendas.com",
        password: "CodePass111!",
        full_name: "Micaela Gomez",
        role: "Director Tecnico",
        zone_id: "e0f1a2b3-c4d5-5e6f-7a8b-456789abcdef0", // Caribe Seco
        distributor_id: "bcdef12345-6789-0abc-def1-23456789abcd", // Insagrin
      },
      {
        email: "nicolas.rodriguez@llevolasriendas.com",
        password: "AccessKey222!",
        full_name: "Nicolas Rodriguez",
        role: "Capitan",
        zone_id: "f5a6b7c8-d9e0-6f7a-8b9c-56789abcdef01", // Meta
        distributor_id: "cdef123456-7890-abcd-ef12-3456789abcde", // Agralba Antioquia
      },
      {
        email: "olivia.martinez@llevolasriendas.com",
        password: "PassCode333!",
        full_name: "Olivia Martinez",
        role: "Director Tecnico",
        zone_id: "a1b2c3d4-e5f6-7a8b-9c0d-6789abcdef012", // Meta
        distributor_id: "def1234567-890a-bcde-f123-456789abcdef", // Agralba Santander
      },
      {
        email: "pablo.sanchez@llevolasriendas.com",
        password: "SecretAccess444!",
        full_name: "Pablo Sanchez",
        role: "Capitan",
        zone_id: "b6c7d8e9-f0a1-8b9c-0d1e-789abcdef0123", // Eje y Valle
        distributor_id: "ef12345678-90ab-cdef-1234-56789abcdef0", // Cosechar
      },
      {
        email: "quiteria.lopez@llevolasriendas.com",
        password: "CodeWord555!",
        full_name: "Quiteria Lopez",
        role: "Director Tecnico",
        zone_id: "c1d2e3f4-a5b6-9c0d-1e2f-89abcdef01234", // Colombia
        distributor_id: "f123456789-0abc-def1-2345-67890abcdef1", // Insagrin
      },
      {
        email: "ramiro.fernandez@llevolasriendas.com",
        password: "AccessPass666!",
        full_name: "Ramiro Fernandez",
        role: "Capitan",
        zone_id: "d6e7f8a9-b0c1-0d1e-2f3a-9abcdef012345", // Antioquia
        distributor_id: "1234567890-abcd-ef12-3456-7890abcdef12", // Agralba Antioquia
      },
      {
        email: "sabrina.gutierrez@llevolasriendas.com",
        password: "PassCode777!",
        full_name: "Sabrina Gutierrez",
        role: "Director Tecnico",
        zone_id: "e1f2a3b4-c5d6-1e2f-3a4b-abcdef01234567", // Mag. Medio
        distributor_id: "234567890a-bcde-f123-4567-890abcdef123", // Agralba Santander
      },
      {
        email: "tomas.gonzalez@llevolasriendas.com",
        password: "SecretKey888!",
        full_name: "Tomas Gonzalez",
        role: "Capitan",
        zone_id: "f6a7b8c9-d0e1-2f3a-4b5c-bcdef012345678", // Santander
        distributor_id: "34567890ab-cdef-1234-5678-90abcdef1234", // Cosechar
      },
      {
        email: "ursula.ramirez@llevolasriendas.com",
        password: "CodeAccess999!",
        full_name: "Ursula Ramirez",
        role: "Director Tecnico",
        zone_id: "a2b3c4d5-e6f7-3a4b-5c6d-cdef0123456789", // Caribe Húmedo
        distributor_id: "4567890abc-def1-2345-6789-0abcdef12345", // Insagrin
      },
      {
        email: "victor.flores@llevolasriendas.com",
        password: "AccessWord000!",
        full_name: "Victor Flores",
        role: "Capitan",
        zone_id: "b7c8d9e0-f1a2-4b5c-6d7e-def0123456789a", // Caribe Seco
        distributor_id: "567890abcd-ef12-3456-7890-abcdef123456", // Agralba Antioquia
      },
      {
        email: "ximena.jimenez@llevolasriendas.com",
        password: "PassSecret111!",
        full_name: "Ximena Jimenez",
        role: "Director Tecnico",
        zone_id: "c2d3e4f5-a6b7-5c6d-7e8f-ef0123456789ab", // Casanare
        distributor_id: "67890abcdef-1234-5678-90ab-cdef12345678", // Agralba Santander
      },
      {
        email: "yolanda.castillo@llevolasriendas.com",
        password: "SecretCode222!",
        full_name: "Yolanda Castillo",
        role: "Capitan",
        zone_id: "d7e8f9a0-b1c2-6d7e-8f9a-f0123456789abc", // Meta
        distributor_id: "7890abcdef1-2345-6789-0abc-def123456789", // Cosechar
      },
      {
        email: "zoilo.ortiz@llevolasriendas.com",
        password: "CodeAccess333!",
        full_name: "Zoilo Ortiz",
        role: "Director Tecnico",
        zone_id: "e2f3a4b5-c6d7-7e8f-9a0b-0123456789abcd", // Eje y Valle
        distributor_id: "890abcdef12-3456-7890-abcd-ef123456789a", // Insagrin
      },
    ]

    const stats = {
      total: usersToImport.length,
      created: 0,
      errors: 0,
    }

    const errors: string[] = []

    for (const user of usersToImport) {
      try {
        console.log(`Importando usuario: ${user.email}`)

        // Crear usuario en auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
          },
        })

        if (authError) {
          console.error(`Error al crear usuario en auth para ${user.email}:`, authError)
          errors.push(`${user.email}: ${authError.message}`)
          stats.errors++
          continue
        }

        if (!authData.user) {
          console.error(`No se obtuvo usuario de auth al crear ${user.email}`)
          errors.push(`${user.email}: No se obtuvo usuario de auth`)
          stats.errors++
          continue
        }

        // Crear perfil en la base de datos
        const profileData = {
          id: authData.user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          zone_id: user.zone_id,
          distributor_id: user.distributor_id,
        }

        const { error: profileError } = await supabase.from("profiles").insert(profileData)

        if (profileError) {
          console.error(`Error al crear perfil para ${user.email}:`, profileError)
          errors.push(`${user.email}: ${profileError.message}`)
          stats.errors++

          // Si falla la creación del perfil, eliminar el usuario de auth
          try {
            await supabase.auth.admin.deleteUser(authData.user.id)
            console.log(`Usuario de auth eliminado debido a error en perfil para ${user.email}`)
          } catch (cleanupError: any) {
            console.error(`Error al limpiar usuario de auth para ${user.email}:`, cleanupError)
          }

          continue
        }

        console.log(`✓ Importado exitosamente: ${user.email}`)
        stats.created++

        // Pequeña pausa para evitar sobrecargar la API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`Error al importar ${user.email}:`, error)
        errors.push(`${user.email}: ${error.message}`)
        stats.errors++
      }
    }

    console.log(`Importación completada: ${stats.created} creados, ${stats.errors} errores.`)

    revalidatePath("/admin/usuarios")

    return {
      success: true,
      message: `Importación completada: ${stats.created} usuarios creados.`,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error("Error general en la importación:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}
