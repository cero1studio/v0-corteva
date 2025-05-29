"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

// Definir el tipo de perfil de usuario
type UserProfile = {
  id: string
  email: string
  role: string
  full_name?: string
  team_id?: string
  team_name?: string
  zone_id?: string
  distributor_id?: string
}

// Definir el tipo del contexto de autenticación
type AuthContextType = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// Crear el contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor de autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/primer-acceso",
    "/ranking-publico",
  ]

  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

  // Función para obtener la ruta del dashboard según el rol
  const getDashboardRoute = (role: string, hasTeam = true) => {
    console.log(`getDashboardRoute: rol=${role}, hasTeam=${hasTeam}`)

    switch (role) {
      case "admin":
        return "/admin/dashboard"
      case "capitan":
        return hasTeam ? "/capitan/dashboard" : "/capitan/crear-equipo"
      case "director_tecnico":
        return "/director-tecnico/dashboard"
      case "supervisor":
        return "/supervisor/dashboard"
      case "representante":
        return "/representante/dashboard"
      default:
        console.log(`Rol desconocido: ${role}`)
        return "/login"
    }
  }

  // Función para obtener el perfil del usuario con manejo robusto de errores
  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    const maxRetries = 3
    const retryDelay = 2000 // 2 segundos entre reintentos

    try {
      console.log(`Obteniendo perfil para usuario: ${userId} (intento ${retryCount + 1}/${maxRetries + 1})`)

      // Verificar que tengamos una sesión válida antes de hacer la consulta
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()
      if (!currentSession) {
        console.error("No hay sesión activa para obtener el perfil")
        return null
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)

        // Si es un error de red y no hemos alcanzado el máximo de reintentos
        if (error.message?.includes("Failed to fetch") && retryCount < maxRetries) {
          console.log(`Error de red, reintentando en ${retryDelay / 1000} segundos...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          return fetchUserProfile(userId, retryCount + 1)
        }

        return null
      }

      // Validar que el perfil tenga los datos mínimos necesarios
      if (!data || !data.role) {
        console.error("Perfil incompleto o sin rol:", data)

        // Si el perfil está incompleto y no hemos alcanzado el máximo de reintentos
        if (retryCount < maxRetries) {
          console.log(`Perfil incompleto, reintentando en ${retryDelay / 1000} segundos...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          return fetchUserProfile(userId, retryCount + 1)
        }

        return null
      }

      console.log("Perfil obtenido exitosamente:", data)

      // Si el usuario es capitán, intentar obtener el nombre del equipo
      let teamName = null
      if (data.role === "capitan" && data.team_id) {
        try {
          const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("name")
            .eq("id", data.team_id)
            .single()

          if (!teamError && team) {
            teamName = team.name
          }
        } catch (err) {
          console.error("Error al obtener el equipo:", err)
          // No es crítico, continuamos sin el nombre del equipo
        }
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
        team_id: data.team_id,
        team_name: teamName,
        zone_id: data.zone_id,
        distributor_id: data.distributor_id,
      }
    } catch (error: any) {
      console.error("Error in fetchUserProfile:", error)

      // Si es un error de red y no hemos alcanzado el máximo de reintentos
      if (error.message?.includes("Failed to fetch") && retryCount < maxRetries) {
        console.log(`Error de red, reintentando en ${retryDelay / 1000} segundos...`)
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        return fetchUserProfile(userId, retryCount + 1)
      }

      return null
    }
  }

  // Función para refrescar el perfil manualmente
  const refreshProfile = async () => {
    if (!user) return

    const userProfile = await fetchUserProfile(user.id)
    if (userProfile) {
      setProfile(userProfile)
    }
  }

  // Función para limpiar tokens corruptos
  const clearCorruptedTokens = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.token")
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]
        if (supabaseKey) {
          localStorage.removeItem(`sb-${supabaseKey}-auth-token`)
        }
      }
    } catch (error) {
      console.error("Error clearing tokens:", error)
    }
  }

  // Inicializar la autenticación
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("Inicializando autenticación...")

        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Error getting session:", error)

          // Si es un error de refresh token, limpiar tokens y continuar
          if (
            error.message?.includes("refresh_token_not_found") ||
            error.message?.includes("invalid_grant") ||
            error.message?.includes("refresh_token")
          ) {
            console.log("Token corrupto detectado, limpiando...")
            clearCorruptedTokens()
            setSession(null)
            setUser(null)
            setProfile(null)

            if (!isPublicRoute) {
              router.push("/login")
            }
            return
          }

          throw error
        }

        if (data?.session) {
          console.log("Sesión encontrada:", data.session.user.id)
          setSession(data.session)
          setUser(data.session.user)

          // Obtener el perfil del usuario con reintentos automáticos
          const userProfile = await fetchUserProfile(data.session.user.id)

          if (!mounted) return

          if (userProfile) {
            console.log("Perfil obtenido - rol:", userProfile.role)
            setProfile(userProfile)

            // Redirigir según el rol si estamos en login
            if (pathname === "/login") {
              const hasTeam = !!userProfile.team_id
              const dashboardRoute = getDashboardRoute(userProfile.role, hasTeam)
              console.log(`Redirigiendo a ${dashboardRoute} desde login`)
              router.push(dashboardRoute)
            }
          } else {
            console.error("No se pudo obtener el perfil del usuario después de varios intentos")
            setError("No se pudo cargar el perfil del usuario. Por favor, recarga la página o inténtalo más tarde.")

            // No redirigir a login si ya tenemos una sesión válida
            // Permitir que el usuario recargue la página
          }
        } else if (!isPublicRoute) {
          // Si no hay sesión y no estamos en una ruta pública, redirigir a login
          console.log("No hay sesión, redirigiendo a login")
          router.push("/login")
        }
      } catch (error: any) {
        if (!mounted) return

        console.error("Auth initialization error:", error)
        setError(error.message)

        // Limpiar tokens si hay error de autenticación
        if (error.message?.includes("refresh_token") || error.message?.includes("invalid_grant")) {
          clearCorruptedTokens()
        }

        if (!isPublicRoute) {
          router.push("/login")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" && session) {
        setSession(session)
        setUser(session.user)
        setError(null)
        setIsLoading(true)

        // Esperar un momento para que la base de datos se sincronice
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Obtener el perfil del usuario con reintentos
        const userProfile = await fetchUserProfile(session.user.id)

        if (!mounted) return

        if (userProfile) {
          console.log("Perfil obtenido después de login - rol:", userProfile.role)
          setProfile(userProfile)
          setIsLoading(false)

          const hasTeam = !!userProfile.team_id
          const dashboardRoute = getDashboardRoute(userProfile.role, hasTeam)
          console.log(`Redirigiendo a ${dashboardRoute} después de iniciar sesión`)
          router.push(dashboardRoute)
        } else {
          console.error("No se pudo obtener el perfil después del login")
          setError("Error al cargar el perfil del usuario. Por favor, recarga la página.")
          setIsLoading(false)
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
        setIsLoading(false)
        if (!isPublicRoute) {
          router.push("/login")
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        setSession(session)
        setUser(session.user)
        setError(null)
      } else if (event === "TOKEN_REFRESH_FAILED") {
        console.log("Token refresh failed, clearing session")
        clearCorruptedTokens()
        setSession(null)
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        if (!isPublicRoute) {
          router.push("/login")
        }
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [router, pathname, isPublicRoute])

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Iniciando sesión con:", email)

      // Limpiar tokens antes de intentar login
      clearCorruptedTokens()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Error de inicio de sesión:", error)
        setError(error.message)
        setIsLoading(false)
        return { error: error.message }
      }

      console.log("Inicio de sesión exitoso, esperando sincronización...")
      // El loading se mantiene activo y se desactiva en el listener de onAuthStateChange
      return { error: null }
    } catch (error: any) {
      console.error("Error en signIn:", error)
      setError(error.message)
      setIsLoading(false)
      return { error: error.message }
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      setIsLoading(true)
      console.log("Cerrando sesión...")

      // Primero cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error al cerrar sesión:", error)
        // No lanzar error, continuar con limpieza local
      }

      // Limpiar tokens y estado local
      clearCorruptedTokens()
      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)

      console.log("Sesión cerrada exitosamente")

      // Redireccionar después de limpiar el estado
      router.push("/login")
    } catch (error: any) {
      console.error("Sign out error:", error)

      // Aún si hay error, limpiar estado local y redireccionar
      clearCorruptedTokens()
      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue = {
    session,
    user,
    profile,
    isLoading,
    error,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
