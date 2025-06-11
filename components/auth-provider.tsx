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
    async (userId: string, userEmail?: string, retries = 3): Promise<UserProfile | null> => {
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

            // Si es el último intento o no es un error de red, fallar
            if (attempt === retries - 1 || !profileError.message?.includes("Failed to fetch")) {
              setError(profileError?.message || "Perfil no encontrado")
              return null
            }

            // Esperar antes del siguiente intento
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
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
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }

      return null
    },
    [],
  )

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

        // Timeout de seguridad más agresivo para producción
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
        }, 3000) // 3 segundos timeout más agresivo

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

            // Verificar sesión real en segundo plano (sin bloquear)
            setTimeout(async () => {
              try {
                const { data, error } = await supabase.auth.getSession()
                if (!error && data.session && mounted) {
                  console.log("AUTH: Background session verification successful")
                  const userProfile = await fetchUserProfile(data.session.user.id, data.session.user.email, 1)
                  if (userProfile && mounted) {
                    setProfile(userProfile)
                    cacheProfile(userProfile)
                  }
                }
              } catch (err) {
                console.log("AUTH: Background verification error (non-critical):", err)
              }
            }, 100)

            return
          }
        }

        // Verificar sesión con timeout
        console.log("AUTH: Checking session with timeout")

        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session check timeout")), 5000),
        )

        const {
          data: { session },
          error,
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any

        if (!mounted) return

        if (error) {
          console.error("AUTH: Session error:", error)
          setSession(null)
          setUser(null)
          setProfile(null)
          setError(error.message)

          if (!isPublicRoute && pathname !== "/login") {
            console.log("AUTH: Session error, redirecting to login")
            router.push("/login")
          }
        } else if (session) {
          console.log("AUTH: Session found for user:", session.user.email)
          setSession(session)
          setUser(session.user)
          cacheSession(session, session.user)

          // Intentar obtener perfil con reintentos
          const userProfile = await fetchUserProfile(session.user.id, session.user.email, 2)
          if (mounted) {
            if (userProfile) {
              setProfile(userProfile)
              cacheProfile(userProfile)

              // Solo redirigir si estamos en login
              if (pathname === "/login") {
                handleRedirection(userProfile)
              }
            } else {
              console.log("AUTH: Could not fetch profile, but continuing with session")
              // Continuar con la sesión aunque no tengamos perfil completo
            }
          }
        } else {
          console.log("AUTH: No session found")
          setSession(null)
          setUser(null)
          setProfile(null)

          if (!isPublicRoute && pathname !== "/login") {
            console.log("AUTH: No session, redirecting to login")
            router.push("/login")
          }
        }
      } catch (err: any) {
        console.error("AUTH Init Error:", err)
        setError(err.message)

        // En caso de error, si no estamos en ruta pública, ir a login
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

        // Terminar loading inmediatamente para el login
        setIsLoading(false)
        setIsInitialized(true)

        // Obtener perfil en segundo plano
        fetchUserProfile(session.user.id, session.user.email, 1)
          .then((userProfile) => {
            if (userProfile) {
              setProfile(userProfile)
              cacheSession(session, session.user)
              cacheProfile(userProfile)

              if (pathname === "/login") {
                handleRedirection(userProfile)
              }
            } else {
              // Si no se puede obtener el perfil, redirigir basado en el email
              console.log("AUTH: Could not fetch profile, using fallback redirection")
              if (pathname === "/login") {
                // Redirección por defecto
                router.push("/admin/dashboard")
              }
            }
          })
          .catch((err) => {
            console.error("AUTH: Profile fetch failed, continuing anyway:", err)
            if (pathname === "/login") {
              router.push("/admin/dashboard")
            }
          })
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

      // Timeout para el login
      const loginPromise = supabase.auth.signInWithPassword({ email, password })
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Login timeout")), 10000))

      const { error: signInError } = (await Promise.race([loginPromise, timeoutPromise])) as any

      if (signInError) {
        console.error("AUTH: Sign in error:", signInError)
        setError(signInError.message)
        return { error: signInError.message }
      }

      console.log("AUTH: Sign in successful")

      // Forzar el fin del loading después de 2 segundos si no se completa
      setTimeout(() => {
        console.log("AUTH: Forcing login loading to end")
        setIsLoading(false)
      }, 2000)

      return { error: null }
    } catch (err: any) {
      console.error("AUTH: Sign in exception:", err)
      setError(err.message)
      return { error: err.message }
    } finally {
      // Asegurar que loading termine después de 3 segundos máximo
      setTimeout(() => {
        setIsLoading(false)
      }, 3000)
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
