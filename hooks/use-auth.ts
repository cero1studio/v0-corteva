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

  // Función para obtener el perfil del usuario
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Obteniendo perfil para usuario:", userId)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      console.log("Perfil obtenido:", data)

      // Si el usuario es capitán, obtener el nombre del equipo
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
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      return null
    }
  }

  // Función para limpiar tokens corruptos
  const clearCorruptedTokens = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.token")
        localStorage.removeItem(
          "sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] + "-auth-token",
        )
      }
    } catch (error) {
      console.error("Error clearing tokens:", error)
    }
  }

  // Inicializar la autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("Inicializando autenticación...")

        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession()

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

          // Obtener el perfil del usuario
          const userProfile = await fetchUserProfile(data.session.user.id)

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
            console.error("No se pudo obtener el perfil del usuario")
            if (!isPublicRoute) {
              router.push("/login")
            }
          }
        } else if (!isPublicRoute) {
          // Si no hay sesión y no estamos en una ruta pública, redirigir a login
          console.log("No hay sesión, redirigiendo a login")
          router.push("/login")
        }
      } catch (error: any) {
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
        setIsLoading(false)
      }
    }

    initAuth()

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" && session) {
        setSession(session)
        setUser(session.user)
        setError(null)

        // Obtener el perfil del usuario
        const userProfile = await fetchUserProfile(session.user.id)

        if (userProfile) {
          console.log("Perfil obtenido después de login - rol:", userProfile.role)
          setProfile(userProfile)
          const hasTeam = !!userProfile.team_id
          const dashboardRoute = getDashboardRoute(userProfile.role, hasTeam)
          console.log(`Redirigiendo a ${dashboardRoute} después de iniciar sesión`)
          router.push(dashboardRoute)
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
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
        if (!isPublicRoute) {
          router.push("/login")
        }
      }
    })

    return () => {
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
        return { error: error.message }
      }

      console.log("Inicio de sesión exitoso")
      // No es necesario hacer nada más aquí, el listener de onAuthStateChange
      // se encargará de actualizar el estado y redirigir
      return { error: null }
    } catch (error: any) {
      console.error("Error en signIn:", error)
      setError(error.message)
      return { error: error.message }
    } finally {
      setIsLoading(false)
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
