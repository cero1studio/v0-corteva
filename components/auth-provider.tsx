"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getClientSupabaseClient } from "@/lib/supabase/client" // Usamos el cliente singleton
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
  const supabase = getClientSupabaseClient() // Obtenemos la instancia singleton

  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Controls initial loading state
  const [isInitialized, setIsInitialized] = useState(false) // Ensures initialization runs once
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

  const fetchUserProfile = useCallback(
    async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, role, team_id, zone_id, distributor_id")
          .eq("id", userId)
          .single()

        if (profileError || !data) {
          setError(profileError?.message || "Perfil no encontrado")
          return null
        }

        let teamName = null
        if (data.role === "capitan" && data.team_id) {
          try {
            const { data: teamData } = await supabase.from("teams").select("name").eq("id", data.team_id).single()
            if (teamData) teamName = teamData.name
          } catch {}
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
        setError(err.message)
        return null
      }
    },
    [supabase],
  )

  const handleRedirection = useCallback(
    (userProfile: UserProfile) => {
      const currentPath = pathname || "/"
      const dashboardRoute = getDashboardRoute(userProfile.role, userProfile.team_id)

      console.log("AUTH: Current path:", currentPath, "Dashboard route:", dashboardRoute)

      // Solo redirigir desde login
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

  // Main initialization effect
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (isInitialized) {
        console.log("AUTH: Already initialized, skipping.")
        return
      }

      try {
        console.log("AUTH: Initializing authentication...")
        setIsLoading(true) // Set loading true at the start of initialization

        const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

        // Try to get session from cache first for non-public routes
        if (!isPublicRoute && pathname !== "/login") {
          const { session: cachedSession, user: cachedUser } = getCachedSessionForced()
          const cachedProfile = getCachedProfileForced()

          if (cachedSession && cachedUser && cachedProfile) {
            console.log("AUTH: Using cached session immediately for direct URL")
            setSession(cachedSession)
            setUser(cachedUser)
            setProfile(cachedProfile)
            setIsLoading(false) // Set loading false if cache is used
            setIsInitialized(true)
            refreshCacheTimestamp()

            // Verify real session in background without blocking
            setTimeout(async () => {
              try {
                const { data, error } = await supabase.auth.getSession()
                if (!error && data.session && mounted) {
                  console.log("AUTH: Background session verification successful")
                  setSession(data.session)
                  setUser(data.session.user)
                  cacheSession(data.session, data.session.user)

                  const userProfile = await fetchUserProfile(data.session.user.id, data.session.user.email)
                  if (userProfile && mounted) {
                    setProfile(userProfile)
                    cacheProfile(userProfile)
                  }
                } else if (error) {
                  console.log("AUTH: Background session verification failed, clearing cache and redirecting to login")
                  clearAllCache()
                  if (mounted && pathname !== "/login") {
                    router.push("/login")
                  }
                }
              } catch (err) {
                console.log("AUTH: Background verification error, clearing cache and redirecting to login")
                clearAllCache()
                if (mounted && pathname !== "/login") {
                  router.push("/login")
                }
              }
            }, 100) // Verify very quickly in background
            return // Exit if cached session is used
          }
        }

        // If no cache or public route, check session normally
        console.log("AUTH: No cache or public route, checking session normally")

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
          clearAllCache() // Clear cache on session error
          if (!isPublicRoute && pathname !== "/login") {
            console.log("AUTH: Redirecting to login due to session error")
            router.push("/login")
          }
        } else if (session) {
          console.log("AUTH: Session found")
          setSession(session)
          setUser(session.user)
          cacheSession(session, session.user)

          const userProfile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted && userProfile) {
            setProfile(userProfile)
            cacheProfile(userProfile)

            if (pathname === "/login") {
              handleRedirection(userProfile)
            }
          }
        } else {
          console.log("AUTH: No session found")
          setSession(null)
          setUser(null)
          setProfile(null)
          clearAllCache() // Clear cache if no session found

          if (!isPublicRoute && pathname !== "/login") {
            console.log("AUTH: Redirecting to login (no session)")
            router.push("/login")
          }
        }
      } catch (err) {
        console.error("AUTH Init Error:", err)
        setError((err as Error).message || "Error de inicialización de autenticación")
        clearAllCache() // Clear cache on any initialization error
        if (mounted && pathname !== "/login") {
          router.push("/login")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true) // Mark as initialized
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [fetchUserProfile, handleRedirection, pathname, router, publicRoutes, supabase, isInitialized]) // Add isInitialized to dependencies

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AUTH: State change event:", event)

      if (event === "SIGNED_IN" && session) {
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
      } else if (event === "SIGNED_OUT") {
        console.log("AUTH: SIGNED_OUT event received")
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
        clearAllCache()

        if (pathname !== "/login") {
          console.log("AUTH: Signed out, redirecting to login")
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
  }, [fetchUserProfile, handleRedirection, pathname, router, supabase]) // Add supabase to dependencies

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        return { error: signInError.message }
      }
      return { error: null }
    } catch (err: any) {
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

      // Limpiar caché y estado local ANTES de llamar a Supabase
      clearAllCache()
      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)

      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("AUTH: Error signing out from Supabase:", error)
        // Aún así continuar con la redirección
      } else {
        console.log("AUTH: Successfully signed out from Supabase")
      }

      setIsLoading(false)

      // Forzar redirección a login
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      } else {
        router.push("/login")
      }
    } catch (err: any) {
      console.error("AUTH: Error during sign out:", err)
      setIsLoading(false)

      // En caso de error, forzar redirección de todas formas
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      } else {
        router.push("/login")
      }
    }
  }

  useEffect(() => {
    // Resetear loading state cuando estamos en login
    if (pathname === "/login") {
      setIsLoading(false)
    }
  }, [pathname])

  const refreshProfile = useCallback(async () => {
    if (!user) return
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
