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

  const [isPageVisible, setIsPageVisible] = useState(true)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
  }, [])

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

  // Inicialización de autenticación
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("AUTH: Initializing authentication...")

        const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

        // Para rutas públicas, no hacer nada especial
        if (isPublicRoute) {
          console.log("AUTH: Public route, skipping auth check")
          setIsLoading(false)
          setIsInitialized(true)
          return
        }

        // Para rutas privadas, verificar caché primero
        const { session: cachedSession, user: cachedUser } = getCachedSessionForced()
        const cachedProfile = getCachedProfileForced()

        if (cachedSession && cachedUser && cachedProfile) {
          console.log("AUTH: Using cached session")
          setSession(cachedSession)
          setUser(cachedUser)
          setProfile(cachedProfile)
          setIsLoading(false)
          setIsInitialized(true)
          refreshCacheTimestamp()
          return
        }

        // Si no hay caché, verificar sesión en Supabase
        console.log("AUTH: No cache, checking session")
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
          clearAllCache()
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
          clearAllCache()
        }
      } catch (err) {
        console.error("AUTH Init Error:", err)
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
  }, [fetchUserProfile, handleRedirection, pathname])

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

        // Limpiar almacenamiento local y cookies
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
          document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
          document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
          document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
        }

        // Solo redirigir si no estamos ya en login
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
  }, [fetchUserProfile, handleRedirection, pathname, router])

  // Page Visibility API para manejar tabs inactivas
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)

      if (isVisible && session) {
        console.log("AUTH: Tab became visible, checking session...")

        // Limpiar timeout de recovery anterior
        if (recoveryTimeoutRef.current) {
          clearTimeout(recoveryTimeoutRef.current)
          recoveryTimeoutRef.current = null
        }

        // Intentar recuperar sesión después de un breve delay
        recoveryTimeoutRef.current = setTimeout(async () => {
          try {
            const {
              data: { session: currentSession },
              error,
            } = await supabase.auth.getSession()

            if (error || !currentSession) {
              console.log("AUTH: Session lost during inactivity, attempting recovery...")

              // Intentar usar cache forzado
              const { session: cachedSession, user: cachedUser } = getCachedSessionForced()
              const cachedProfile = getCachedProfileForced()

              if (cachedSession && cachedUser && cachedProfile) {
                console.log("AUTH: Recovered from cache")
                setSession(cachedSession)
                setUser(cachedUser)
                setProfile(cachedProfile)
              } else {
                console.log("AUTH: No cache available, redirecting to login")
                await signOut()
              }
            } else {
              console.log("AUTH: Session still valid after inactivity")
              refreshCacheTimestamp()
            }
          } catch (err) {
            console.error("AUTH: Error during session recovery:", err)
          }
        }, 1000)

        startHeartbeat()
      } else if (!isVisible) {
        console.log("AUTH: Tab became hidden")
        stopHeartbeat()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Iniciar heartbeat si ya hay sesión
    const startHeartbeat = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)

      heartbeatRef.current = setInterval(async () => {
        if (session && isPageVisible) {
          try {
            await supabase.auth.getSession()
            refreshCacheTimestamp()
          } catch (error) {
            console.warn("Heartbeat failed:", error)
          }
        }
      }, 30000) // 30 segundos
    }

    const stopHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }

    if (session && isPageVisible) {
      startHeartbeat()
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      stopHeartbeat()
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [session, isPageVisible])

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
      console.log("AUTH: Starting FORCED sign out process...")

      // 🚨 FORZAR LIMPIEZA INMEDIATA - NUEVO
      if (typeof window !== "undefined") {
        // Detener TODOS los timeouts activos
        const highestTimeoutId = setTimeout(() => {}, 0)
        for (let i = 0; i < highestTimeoutId; i++) {
          clearTimeout(i)
        }

        // Limpiar INMEDIATAMENTE antes de cualquier proceso async
        localStorage.clear()
        sessionStorage.clear()
      }

      // NO setear loading aquí - puede interferir
      // setIsLoading(true) // <-- REMOVER ESTA LÍNEA
      setError(null)

      // Primero cerrar sesión en Supabase y esperar
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("AUTH: Error signing out from Supabase:", error)
      } else {
        console.log("AUTH: Successfully signed out from Supabase")
      }

      // Después de cerrar sesión exitosamente, limpiar todo
      clearAllCache()
      stopHeartbeat()
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
        recoveryTimeoutRef.current = null
      }
      setSession(null)
      setUser(null)
      setProfile(null)

      // Limpiar almacenamiento local y cookies después del signOut
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()

        // Limpiar cookies específicas de Supabase
        const cookiesToClear = [
          "sb-access-token",
          "sb-refresh-token",
          "session",
          "supabase-auth-token",
          "sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] + "-auth-token",
        ]

        cookiesToClear.forEach((cookieName) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        })
      }

      // Esperar un momento para asegurar que todo se limpie
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Al final, DESPUÉS de todo:
      setIsLoading(false) // <-- MOVER AQUÍ

      // Forzar recarga completa de la página
      if (typeof window !== "undefined") {
        window.location.href = "/login"
        return // No usar router.push
      }
    } catch (err: any) {
      console.error("AUTH: Error during sign out:", err)
      setIsLoading(false)

      // En caso de error, limpiar de todas formas y redirigir
      clearAllCache()
      setSession(null)
      setUser(null)
      setProfile(null)

      router.push("/login")
    }
  }

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

  const startHeartbeat = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)

    heartbeatRef.current = setInterval(async () => {
      if (session && isPageVisible) {
        try {
          await supabase.auth.getSession()
          refreshCacheTimestamp()
        } catch (error) {
          console.warn("Heartbeat failed:", error)
        }
      }
    }, 30000) // 30 segundos
  }

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }

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
