import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { AUTH_ERROR_CODES } from "./auth-errors"

/**
 * Valida las credenciales de un usuario contra auth.users de Supabase
 * Usa SUPABASE_SERVICE_ROLE_KEY para acceder a la tabla auth
 * Lanza errores con códigos específicos para mejor manejo
 */
export async function validateCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables")
    throw new Error(AUTH_ERROR_CODES.SUPABASE_ERROR)
  }

  try {
    // Crear cliente admin de Supabase
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Intentar autenticar usando el método de Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("❌ Authentication failed:", error.message)
      
      // Mapear errores de Supabase a códigos específicos
      if (error.message.includes("Invalid login") || error.message.includes("Invalid credentials")) {
        throw new Error(AUTH_ERROR_CODES.INVALID_CREDENTIALS)
      }
      if (error.message.includes("Email not confirmed")) {
        throw new Error(AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED)
      }
      if (error.message.includes("User not found") || error.message.includes("No user found")) {
        throw new Error(AUTH_ERROR_CODES.USER_NOT_FOUND)
      }
      // Error genérico de autenticación
      throw new Error(AUTH_ERROR_CODES.AUTH_ERROR)
    }

    if (!data.user) {
      throw new Error(AUTH_ERROR_CODES.INVALID_CREDENTIALS)
    }

    // Retornar el ID y email del usuario autenticado
    return {
      id: data.user.id,
      email: data.user.email || email,
    }
  } catch (error: any) {
    // Si ya es un error con código, propagarlo
    if (error.message && Object.values(AUTH_ERROR_CODES).includes(error.message)) {
      throw error
    }
    // Error de conexión o desconocido
    console.error("❌ Error validating credentials:", error)
    throw new Error(AUTH_ERROR_CODES.SUPABASE_ERROR)
  }
}

/**
 * Obtiene el perfil de un usuario desde la tabla profiles
 * Lanza error si el perfil no se encuentra
 */
export async function getUserProfile(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables")
    throw new Error(AUTH_ERROR_CODES.SUPABASE_ERROR)
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

    // Obtener perfil con zone_id y distributor_id directamente de la tabla profiles
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, team_id, zone_id, distributor_id")
      .eq("id", userId)
      .single()

    if (error || !profile) {
      console.error("❌ Error fetching profile:", error)
      throw new Error(AUTH_ERROR_CODES.PROFILE_NOT_FOUND)
    }

    // Si es capitán y tiene equipo, obtener el nombre del equipo
    let teamName: string | null = null
    if (profile.role === "capitan" && profile.team_id) {
      const { data: teamData } = await supabase
        .from("teams")
        .select("name")
        .eq("id", profile.team_id)
        .single()
      if (teamData) teamName = teamData.name
    }

    console.log("[AUTH-UTILS] Profile fetched:", {
      id: profile.id,
      role: profile.role,
      team_id: profile.team_id,
      zone_id: profile.zone_id,
      distributor_id: profile.distributor_id,
      hasZone: !!profile.zone_id,
      hasDistributor: !!profile.distributor_id,
    })

    return {
      id: profile.id,
      role: profile.role,
      full_name: profile.full_name,
      team_id: profile.team_id,
      team_name: teamName,
      zone_id: profile.zone_id || undefined,
      distributor_id: profile.distributor_id || undefined,
    }
  } catch (error: any) {
    // Si ya es un error con código, propagarlo
    if (error.message && Object.values(AUTH_ERROR_CODES).includes(error.message)) {
      throw error
    }
    console.error("❌ Error in getUserProfile:", error)
    throw new Error(AUTH_ERROR_CODES.SUPABASE_ERROR)
  }
}
