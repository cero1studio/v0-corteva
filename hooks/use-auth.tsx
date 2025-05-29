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
        return "/login"
    }
  }

  // Función simplificada para obtener el perfil del usuario
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log(`Obteniendo perfil para usuario: ${userId}`)

      // Esperar 4 segundos para que la base de datos se sincronice
      await new Promise((resolve) => setTimeout(resolve, 4000))

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      if (!data || !data.role) {
        console.error("Perfil incompleto o sin rol:", data)
        return null
      }

      console.log("Perfil obtenido exitosamente:", data)

      // Si el usuario es capitán, obtener el nombre del equipo
      let teamName = null
      if (data.role === "capitan" && data.team_id) {
        try {
          const { data: team } = await supabase.from("teams").select("name").eq("id", data.team_id).single()

          if (team) {
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
    } catch (error: any) {
      console.error("Error in fetchUserProfile:", error)
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

  // Inicializar la autenticación de forma simple
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("Inicializando autenticación...")

        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Error getting session:", error)
          setSession(null)
          setUser(null)
          setProfile(null)
          if (!isPublicRoute) {
            router.push("/login")
          }
          return
        }

        if (data?.session) {
          console.log("Sesión encontrada:", data.session.user.id)
          setSession(data.session)
          setUser(data.session.user)

          const userProfile = await fetchUserProfile(data.session.user.id)

          if (!mounted) return

          if (userProfile) {
            console.log("Perfil obtenido - rol:", userProfile.role)
            setProfile(userProfile)

            // Solo redirigir si estamos en login
            if (pathname === "/login") {
              const hasTeam = !!userProfile.team_id
              const dashboardRoute = getDashboardRoute(userProfile.role, hasTeam)
              console.log(`Redirigiendo a ${dashboardRoute}`)
              router.push(dashboardRoute)
            }
          } else {
            console.error("No se pudo obtener el perfil del usuario")
            setError("No se pudo cargar el perfil del usuario")
          }
        } else if (!isPublicRoute) {
          console.log("No hay sesión, redirigiendo a login")
          router.push("/login")
        }
      } catch (error: any) {
        if (!mounted) return
        console.error("Auth initialization error:", error)
        setError(error.message)
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

      if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
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

  // Función simplificada para iniciar sesión
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Iniciando sesión con:", email)

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

      if (data.session && data.user) {
        setSession(data.session)
        setUser(data.user)

        // Obtener perfil después del login exitoso
        const userProfile = await fetchUserProfile(data.user.id)

        if (userProfile) {
          setProfile(userProfile)
          const hasTeam = !!userProfile.team_id
          const dashboardRoute = getDashboardRoute(userProfile.role, hasTeam)
          console.log(`Login exitoso, redirigiendo a ${dashboardRoute}`)
          router.push(dashboardRoute)
        } else {
          setError("No se pudo cargar el perfil del usuario")
        }
      }

      setIsLoading(false)
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

      await supabase.auth.signOut()

      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)

      router.push("/login")
    } catch (error: any) {
      console.error("Sign out error:", error)
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
