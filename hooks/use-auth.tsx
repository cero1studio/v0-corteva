"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

type UserProfile = {
  id: string
  email?: string
  role: string
  full_name?: string
  team_id?: string | null
  team_name?: string | null
  zone_id?: string
  distributor_id?: string
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/primer-acceso",
    "/ranking-publico",
  ]

  const getDashboardRoute = useCallback((role: string, teamId?: string | null) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard"
      case "capitan":
        return teamId ? "/capitan/dashboard" : "/capitan/crear-equipo"
      case "director_tecnico":
        return "/director-tecnico/dashboard"
      case "supervisor":
        return "/supervisor/dashboard"
      case "representante":
        return "/representante/dashboard"
      default:
        return "/login"
    }
  }, [])

  const fetchUserProfile = useCallback(
    async (userId: string, userEmail?: string, retries = 3): Promise<UserProfile | null> => {
      console.log(`AUTH: Fetching profile for user ID: ${userId}, retries left: ${retries}`)

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          // Intentar primero sin join para evitar problemas de relaciones
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, team_id, zone_id, distributor_id")
            .eq("id", userId)
            .single()

          if (profileError) {
            console.error(`AUTH: Error fetching profile (attempt ${attempt + 1}):`, profileError)
            if (attempt === retries - 1) {
              setError(`Error al cargar perfil: ${profileError.message}`)
              return null
            }
            // Esperar antes del siguiente intento
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
            continue
          }

          if (!data) {
            console.error("AUTH: No profile data found for user:", userId)
            if (attempt === retries - 1) {
              setError("No se encontró el perfil del usuario.")
              return null
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
            continue
          }

          console.log("AUTH: Profile fetched successfully:", data)

          // Si es capitán y tiene team_id, obtener el nombre del equipo por separado
          let teamName = null
          if (data.role === "capitan" && data.team_id) {
            try {
              const { data: teamData } = await supabase.from("teams").select("name").eq("id", data.team_id).single()

              if (teamData) {
                teamName = teamData.name
              }
            } catch (teamError) {
              console.warn("AUTH: Could not fetch team name:", teamError)
              // No es crítico, continuamos sin el nombre del equipo
            }
          }

          return {
            id: data.id,
            email: userEmail,
            role: data.role,
            full_name: data.full_name,
            team_id: data.team_id,
            team_name: teamName,
            zone_id: data.zone_id,
            distributor_id: data.distributor_id,
          }
        } catch (err: any) {
          console.error(`AUTH: Exception in fetchUserProfile (attempt ${attempt + 1}):`, err)
          if (attempt === retries - 1) {
            setError(`Excepción al cargar perfil: ${err.message}`)
            return null
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }

      return null
    },
    [setError],
  )

  // Función separada para manejar redirecciones después de que el perfil esté listo
// Función separada para manejar redirecciones después de que el perfil esté listo
const handleRedirection = useCallback(
  (userProfile: UserProfile) => {
    const currentPath = pathname || "/"
    const dashboardRoute = getDashboardRoute(userProfile.role, userProfile.team_id)

    console.log(`AUTH: Checking redirection. Current: ${currentPath}, Dashboard: ${dashboardRoute}`)

    // Solo redirigir desde login o si es capitán sin equipo
    if (currentPath === "/login") {
      console.log(`AUTH: Redirecting from login to ${dashboardRoute}`)
      window.location.replace(dashboardRoute) // ← cambio aquí
    } else if (
      userProfile.role === "capitan" &&
      !userProfile.team_id &&
      currentPath !== "/capitan/crear-equipo"
    ) {
      console.log(`AUTH: Captain without team, redirecting to create team`)
      window.location.replace("/capitan/crear-equipo") // ← cambio aquí
    }
  },
  [pathname, getDashboardRoute],
)


  // Inicialización de la sesión
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("AUTH: Initializing authentication...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("AUTH: Error getting initial session:", error)
          setSession(null)
          setUser(null)
          setProfile(null)
        } else if (session) {
          console.log("AUTH: Initial session found")
          setSession(session)
          setUser(session.user)

          // Intentar cargar el perfil
          const userProfile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted && userProfile) {
            setProfile(userProfile)
            // Manejar redirección después de un pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
              if (mounted) {
                handleRedirection(userProfile)
              }
            }, 100)
          }
        } else {
          console.log("AUTH: No initial session")
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error("AUTH: Error in auth initialization:", err)
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [fetchUserProfile, handleRedirection])

  // Listener para cambios de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`AUTH: Auth state changed - Event: ${event}`)

      if (event === "SIGNED_IN" && session) {
        setSession(session)
        setUser(session.user)
        setError(null)

        const userProfile = await fetchUserProfile(session.user.id, session.user.email)
        if (userProfile) {
          setProfile(userProfile)
          setTimeout(() => handleRedirection(userProfile), 100)
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
        router.replace("/login")
      } else if (event === "TOKEN_REFRESHED" && session) {
        setSession(session)
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, handleRedirection, router])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("AUTH: Attempting sign in with:", email)

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("AUTH: Sign in error:", signInError)
        setError(signInError.message)
        return { error: signInError.message }
      }

      console.log("AUTH: Sign in successful")
      return { error: null }
    } catch (err: any) {
      console.error("AUTH: Exception in signIn:", err)
      setError(err.message)
      return { error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      console.log("AUTH: Signing out...")
      await supabase.auth.signOut()
    } catch (err: any) {
      console.error("AUTH: Error signing out:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    const userProfile = await fetchUserProfile(user.id, user.email)
    if (userProfile) {
      setProfile(userProfile)
    }
    setIsLoading(false)
  }, [user, fetchUserProfile])

  const contextValue = {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    error,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
