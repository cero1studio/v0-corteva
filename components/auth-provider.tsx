"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

// Importar las funciones de caché
import {
  cacheSession,
  cacheProfile,
  clearAllCache,
  refreshCacheTimestamp,
  getCachedSessionForced,
  getCachedProfileForced,
  type UserProfile,
} from "@/lib/session-cache"

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
      case "arbitro":
        return "/arbitro/dashboard"
      default:
        return "/login"
    }
  }, [])

  const fetchUserProfile = useCallback(async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    try {
      console.log("AUTH: Fetching profile for user:", userId)

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, team_id, zone_id, distributor_id")
        .eq("id", userId)
        .single()

      if (profileError || !data) {
        console.error("AUTH: Profile error:", profileError)
        setError(profileError?.message || "Perfil no encontrado")
        return null
      }

      console.log("AUTH: Profile fetched:", data)

      let teamName = null
      if (data.role === "capitan" && data.team_id) {
        try {
          const { data: teamData } = await supabase.from("teams").select("name").eq("id", data.team_id).single()
          if (teamData) teamName = teamData.name
        } catch (teamError) {
          console.log("AUTH: Could not fetch team name:", teamError)
        }
      }

      const userProfile = {
        id: data.id,
        email: userEmail,
        role: data.role,
        full_name: data.full_name,
        team_id: data.team_id,
        team_name: teamName,
        zone_id: data.zone_id,
        distributor_id: data.distributor_id,
      }

      console.log("AUTH: Final profile:", userProfile)
      return userProfile
    } catch (err: any) {
      console.error("AUTH: Error fetching profile:", err)
      setError(err.message)
      return null
    }
  }, [])

  const handleRedirection = useCallback(
    (userProfile: UserProfile) => {
      const currentPath = pathname || "/"
      const dashboardRoute = getDashboardRoute(userProfile.role, userProfile.team_id)

      console.log(
        "AUTH: Handling redirection - Current path:",
        currentPath,
        "Dashboard route:",
        dashboardRoute,
        "Role:",
        userProfile.role,
      )

      // Solo redirigir desde login o si es capitán sin equipo
      if (currentPath === "/login") {
        console.log("AUTH: Redirecting from login to dashboard")
        router.push(dashboardRoute)
      } else if (userProfile.role === "capitan" && !userProfile.team_id && currentPath !== "/capitan/crear-equipo") {
        console.log("AUTH: Captain without team, redirecting to create team")
        router.push("/capitan/crear-equipo")
      }
    },
    [pathname, getDashboardRoute, router],
  )

  // Inicialización inmediata con caché para URLs directas
  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        console.log("AUTH: Initializing authentication for path:", pathname)

        const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))
        console.log("AUTH: Is public route:", isPublicRoute)

        // Timeout de seguridad más corto para evitar loading infinito
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log("AUTH: Timeout reached, forcing loading to false")
            setIsLoading(false)
            setIsInitialized(true)
          }
        }, 5000) // 5 segundos timeout

        // Para URLs directas no públicas, usar caché inmediatamente
        if (!isPublicRoute && pathname !== "/login") {
          const { session: cachedSession, user: cachedUser } = getCachedSessionForced()
          const cachedProfile = getCachedProfileForced()

          if (cachedSession && cachedUser && cachedProfile) {
            console.log("AUTH: Using cached session immediately for direct URL")
            setSession(cachedSession)
            setUser(cachedUser)
            setProfile(cachedProfile)
            setIsLoading(false)
            setIsInitialized(true)
            refreshCacheTimestamp()

            // Verificar sesión real en segundo plano
            setTimeout(async () => {
              try {
                const { data, error } = await supabase.auth.getSession()
                if (!error && data.session && mounted) {
                  console.log("AUTH: Background session verification successful")
                  const userProfile = await fetchUserProfile(data.session.user.id, data.session.user.email)
                  if (userProfile && mounted) {
                    setProfile(userProfile)
                    cacheProfile(userProfile)
                  }
                }
              } catch (err) {
                console.log("AUTH: Background verification error, keeping cache")
              }
            }, 100)

            return
          }
        }

        // Verificar sesión normalmente
        console.log("AUTH: Checking session normally")

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("AUTH: Session error:", error)
          setSession(null)
          setUser(null)
          setProfile(null)
          setError(error.message)
          if (isPublicRoute) clearAllCache()
        } else if (session) {
          console.log("AUTH: Session found for user:", session.user.email)
          setSession(session)
          setUser(session.user)
          cacheSession(session, session.user)

          const userProfile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted) {
            if (userProfile) {
              setProfile(userProfile)
              cacheProfile(userProfile)

              // Solo redirigir si estamos en login
              if (pathname === "/login") {
                handleRedirection(userProfile)
              }
            } else {
              console.log("AUTH: Could not fetch profile, but continuing")
              setError("No se pudo cargar el perfil del usuario")
            }
          }
        } else {
          console.log("AUTH: No session found")
          setSession(null)
          setUser(null)
          setProfile(null)

          if (isPublicRoute || pathname === "/login") {
            clearAllCache()
          } else {
            console.log("AUTH: Redirecting to login from protected route")
            router.push("/login")
          }
        }
      } catch (err: any) {
        console.error("AUTH Init Error:", err)
        setError(err.message)
      } finally {
        if (mounted) {
          console.log("AUTH: Initialization complete")
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [fetchUserProfile, handleRedirection, pathname, router])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AUTH: State change event:", event)

      if (event === "SIGNED_IN" && session) {
        console.log("AUTH: User signed in:", session.user.email)
        setSession(session)
        setUser(session.user)
        setError(null)

        const userProfile = await fetchUserProfile(session.user.id, session.user.email)
        if (userProfile) {
          setProfile(userProfile)
          cacheSession(session, session.user)
          cacheProfile(userProfile)

          if (pathname === "/login") {
            handleRedirection(userProfile)
          }
        }

        // Asegurar que loading se ponga en false después del login
        setIsLoading(false)
        setIsInitialized(true)
      } else if (event === "SIGNED_OUT") {
        console.log("AUTH: User signed out")
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
        clearAllCache()

        if (pathname !== "/login") {
          router.push("/login")
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log("AUTH: Token refreshed")
        setSession(session)
        setUser(session.user)
        cacheSession(session, session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, handleRedirection, pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("AUTH: Attempting sign in for:", email)
      setIsLoading(true)
      setError(null)

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        console.error("AUTH: Sign in error:", signInError)
        setError(signInError.message)
        return { error: signInError.message }
      }

      console.log("AUTH: Sign in successful")
      return { error: null }
    } catch (err: any) {
      console.error("AUTH: Sign in exception:", err)
      setError(err.message)
      return { error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log("AUTH: Starting sign out process...")
      setIsLoading(true)

      clearAllCache()
      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("AUTH: Error signing out:", error)
      }

      setIsLoading(false)

      if (pathname !== "/login") {
        router.push("/login")
      }
    } catch (err: any) {
      console.error("AUTH: Error during sign out:", err)
      setIsLoading(false)
      if (pathname !== "/login") {
        router.push("/login")
      }
    }
  }

  // Resetear loading state cuando estamos en login
  useEffect(() => {
    if (pathname === "/login") {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [pathname])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    console.log("AUTH: Refreshing profile")
    setIsLoading(true)
    const userProfile = await fetchUserProfile(user.id, user.email)
    if (userProfile) {
      setProfile(userProfile)
      cacheProfile(userProfile)
    }
    setIsLoading(false)
  }, [user, fetchUserProfile])

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isLoading, isInitialized, error, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
