import type { Session, User } from "@supabase/supabase-js"

// Definir el tipo UserProfile aquí para evitar dependencias circulares
export type UserProfile = {
  id: string
  email?: string
  role: string
  full_name?: string
  team_id?: string | null
  team_name?: string | null
  zone_id?: string
  distributor_id?: string
}

// Claves para almacenar en localStorage
const SESSION_CACHE_KEY = "sg_session_cache"
const PROFILE_CACHE_KEY = "sg_profile_cache"
const CACHE_TIMESTAMP_KEY = "sg_cache_timestamp"
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 horas en milisegundos

// Interfaz para el objeto de caché
interface SessionCache {
  session: Session | null
  user: User | null
  timestamp: number
}

interface ProfileCache {
  profile: UserProfile | null
  timestamp: number
}

/**
 * Guarda la sesión en localStorage
 */
export const cacheSession = (session: Session | null, user: User | null): void => {
  if (typeof window === "undefined") return

  try {
    const cacheData: SessionCache = {
      session,
      user,
      timestamp: Date.now(),
    }
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cacheData))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    console.log("✅ Session cached successfully")
  } catch (error) {
    console.error("❌ Error caching session:", error)
  }
}

/**
 * Guarda el perfil de usuario en localStorage
 */
export const cacheProfile = (profile: UserProfile | null): void => {
  if (typeof window === "undefined") return

  try {
    const cacheData: ProfileCache = {
      profile,
      timestamp: Date.now(),
    }
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData))
    console.log("✅ Profile cached successfully")
  } catch (error) {
    console.error("❌ Error caching profile:", error)
  }
}

/**
 * Recupera la sesión desde localStorage
 */
export const getCachedSession = (): { session: Session | null; user: User | null } => {
  if (typeof window === "undefined") return { session: null, user: null }

  try {
    const cachedData = localStorage.getItem(SESSION_CACHE_KEY)
    if (!cachedData) return { session: null, user: null }

    const { session, user, timestamp }: SessionCache = JSON.parse(cachedData)

    // Verificar si la caché ha expirado
    if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
      console.log("⚠️ Cached session expired")
      clearSessionCache()
      return { session: null, user: null }
    }

    console.log("✅ Using cached session")
    return { session, user }
  } catch (error) {
    console.error("❌ Error retrieving cached session:", error)
    return { session: null, user: null }
  }
}

/**
 * Recupera el perfil de usuario desde localStorage
 */
export const getCachedProfile = (): UserProfile | null => {
  if (typeof window === "undefined") return null

  try {
    const cachedData = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!cachedData) return null

    const { profile, timestamp }: ProfileCache = JSON.parse(cachedData)

    // Verificar si la caché ha expirado
    if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
      console.log("⚠️ Cached profile expired")
      clearProfileCache()
      return null
    }

    console.log("✅ Using cached profile")
    return profile
  } catch (error) {
    console.error("❌ Error retrieving cached profile:", error)
    return null
  }
}

/**
 * Limpia la caché de sesión
 */
export const clearSessionCache = (): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(SESSION_CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    console.log("✅ Session cache cleared")
  } catch (error) {
    console.error("❌ Error clearing session cache:", error)
  }
}

/**
 * Limpia la caché del perfil
 */
export const clearProfileCache = (): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(PROFILE_CACHE_KEY)
    console.log("✅ Profile cache cleared")
  } catch (error) {
    console.error("❌ Error clearing profile cache:", error)
  }
}

/**
 * Limpia toda la caché relacionada con la autenticación
 */
export const clearAllCache = (): void => {
  clearSessionCache()
  clearProfileCache()
}

/**
 * Verifica si hay una sesión en caché válida
 */
export const hasCachedSession = (): boolean => {
  if (typeof window === "undefined") return false

  try {
    const cachedData = localStorage.getItem(SESSION_CACHE_KEY)
    if (!cachedData) return false

    const { timestamp }: SessionCache = JSON.parse(cachedData)
    const isValid = Date.now() - timestamp <= CACHE_EXPIRY_TIME

    if (!isValid) {
      clearSessionCache()
      return false
    }

    return true
  } catch {
    clearSessionCache()
    return false
  }
}

/**
 * Verifica si hay un perfil en caché válido
 */
export const hasCachedProfile = (): boolean => {
  if (typeof window === "undefined") return false

  try {
    const cachedData = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!cachedData) return false

    const { timestamp }: ProfileCache = JSON.parse(cachedData)
    const isValid = Date.now() - timestamp <= CACHE_EXPIRY_TIME

    if (!isValid) {
      clearProfileCache()
      return false
    }

    return true
  } catch {
    clearProfileCache()
    return false
  }
}

/**
 * Actualiza la marca de tiempo de la caché para extender su vida útil
 */
export const refreshCacheTimestamp = (): void => {
  if (typeof window === "undefined") return

  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
}

/**
 * Obtiene información de debug sobre el estado de la caché
 */
export const getCacheDebugInfo = () => {
  if (typeof window === "undefined") return null

  try {
    const sessionCache = localStorage.getItem(SESSION_CACHE_KEY)
    const profileCache = localStorage.getItem(PROFILE_CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

    return {
      hasSessionCache: !!sessionCache,
      hasProfileCache: !!profileCache,
      cacheAge: timestamp ? Date.now() - Number.parseInt(timestamp) : null,
      isExpired: timestamp ? Date.now() - Number.parseInt(timestamp) > CACHE_EXPIRY_TIME : true,
    }
  } catch {
    return null
  }
}
