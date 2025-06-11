"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
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

  // Usar useRef para acceder al valor actual de session en closures
  const sessionRef = useRef<Session | null>(null)

  // Mantener la referencia actualizada
  useEffect(() => {
    sessionRef.current = session
  }, [session])

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
    async (userId: string, userEmail?: string, retries = 2): Promise<UserProfile | null> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          console.log(`AUTH: Fetching profile for user: ${userId} (attempt ${attempt + 1}/${retries})`)

          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, team_id, zone_id, distributor_id")
            .eq("id", userId)
            .single()

          if (profileError) {
            console.error(`AUTH: Profile error (attempt ${attempt + 1}):`, profileError)

            // Si es el último intento, fallar
            if (attempt === retries - 1) {
              setError(profileError?.message || "Perfil no encontrado")
              return null
            }

            // Esperar antes del siguiente intento
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }

          if (!data) {
            console.error("AUTH: No profile data returned")
            setError("Perfil no encontrado")
            return null
          }

          console.log("AUTH: Profile fetched successfully:", data)

          // Intentar obtener el nombre del equipo solo si es capitán y tiene team_id
          let teamName = null
          if (data.role === "capitan" && data.team_id) {
            try {
              const { data: teamData } = await supabase.from("teams").select("name").eq("id", data.team_id).single()
              if (teamData) teamName = teamData.name
            } catch (teamError) {
              console.log("AUTH: Could not fetch team name (non-critical):", teamError)
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
          console.error(`AUTH: Error fetching profile (attempt ${attempt + 1}):`, err)

          // Si es el último intento, fallar
          if (attempt === retries - 1) {
            setError(err.message)
            return null
          }

          // Esperar antes del siguiente intento
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      return null
    },
    [],
  )

  const performRedirection = useCallback(
    (userProfile: UserProfile) => {
      const dashboardRoute = getDashboardRoute(userProfile.role, userProfile.team_id)
      console.log("AUTH: Performing redirection to:", dashboardRoute, "for role:", userProfile.role)

      // Usar window.location para forzar la navegación en producción
      if (typeof window !== "undefined") {
        console.log("AUTH: Using window.location.href for redirection")
        window.location.href = dashboardRoute
      } else {
        console.log("AUTH: Using router.push for redirection")
        router.push(dashboardRoute)
      }
    },
    [getDashboardRoute, router],
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

        // Timeout de seguridad
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log("AUTH: TIMEOUT - Forcing loading to false after 3 seconds")
            setIsLoading(false)
            setIsInitialized(true)

            // Usar sessionRef.current en lugar de session
            if (!isPublicRoute && !sessionRef.current) {
              console.log("AUTH: TIMEOUT - Redirecting to login")
              router.push("/login")
            }
          }
        }, 3000)

        // Para rutas públicas, terminar loading inmediatamente
        if (isPublicRoute) {
          console.log("AUTH: Public route, ending loading immediately")
          setIsLoading(false)
          setIsInitialized(true)
          return
        }

        // Para URLs directas no públicas, usar caché inmediatamente
        if (pathname !== "/login") {
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
            return
          }
        }

        // Verificar sesión
        console.log("AUTH: Checking session")
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

          if (!isPublicRoute && pathname !== "/login") {
            router.push("/login")
          }
        } else if (session) {
          console.log("AUTH: Session found for user:", session.user.email)
          setSession(session)
          setUser(session.user)
          cacheSession(session, session.user)

          // Obtener perfil
          const userProfile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted && userProfile) {
            setProfile(userProfile)
            cacheProfile(userProfile)
          }
        } else {
          console.log("AUTH: No session found")
          setSession(null)
          setUser(null)
          setProfile(null)

          if (!isPublicRoute && pathname !== "/login") {
            router.push("/login")
          }
        }
      } catch (err: any) {
        console.error("AUTH Init Error:", err)
        setError(err.message)

        if (!publicRoutes.some((route) => pathname?.startsWith(route)) && pathname !== "/login") {
          router.push("/login")
        }
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
  }, [fetchUserProfile, pathname, router])

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
        setIsLoading(false)
        setIsInitialized(true)

        // Solo redirigir si estamos en login
        if (pathname === "/login") {
          console.log("AUTH: Login detected, fetching profile for redirection")

          try {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email, 1)
            if (userProfile) {
              console.log("AUTH: Profile obtained, redirecting...")
              setProfile(userProfile)
              cacheSession(session, session.user)
              cacheProfile(userProfile)

              // Redirección inmediata
              performRedirection(userProfile)
            } else {
              console.log("AUTH: Could not fetch profile, using fallback redirection")
              // Redirección de emergencia basada en email
              const fallbackRoute = session.user.email?.includes("admin")
                ? "/admin/dashboard"
                : "/director-tecnico/dashboard"
              if (typeof window !== "undefined") {
                window.location.href = fallbackRoute
              } else {
                router.push(fallbackRoute)
              }
            }
          } catch (err) {
            console.error("AUTH: Profile fetch failed during login, using emergency redirection:", err)
            if (typeof window !== "undefined") {
              window.location.href = "/admin/dashboard"
            } else {
              router.push("/admin/dashboard")
            }
          }
        } else {
          // Si no estamos en login, solo actualizar el perfil en segundo plano
          fetchUserProfile(session.user.id, session.user.email, 1)
            .then((userProfile) => {
              if (userProfile) {
                setProfile(userProfile)
                cacheSession(session, session.user)
                cacheProfile(userProfile)
              }
            })
            .catch((err) => {
              console.log("AUTH: Background profile fetch failed:", err)
            })
        }
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
  }, [fetchUserProfile, performRedirection, pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("AUTH: Attempting sign in for:", email)
      setIsLoading(true)
      setError(null)

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        console.error("AUTH: Sign in error:", signInError)
        setError(signInError.message)
        setIsLoading(false)
        return { error: signInError.message }
      }

      console.log("AUTH: Sign in successful")
      // No terminar loading aquí, dejar que onAuthStateChange maneje la redirección
      return { error: null }
    } catch (err: any) {
      console.error("AUTH: Sign in exception:", err)
      setError(err.message)
      setIsLoading(false)
      return { error: err.message }
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
    const userProfile = await fetchUserProfile(user.id, user.email, 2)
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
