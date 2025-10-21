"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { cacheSession, cacheProfile, getCachedSession, getCachedProfile, clearAllCache } from "@/lib/session-cache"

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
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, team_id, zone_id, distributor_id")
        .eq("id", userId)
        .single()

      if (profileError || !data) {
        console.error("Profile fetch error:", profileError)
        return null
      }

      let teamName = null
      if (data.role === "capitan" && data.team_id) {
        try {
          const { data: teamData } = await supabase.from("teams").select("name").eq("id", data.team_id).single()
          if (teamData) teamName = teamData.name
        } catch (e) {
          console.warn("Could not fetch team name:", e)
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
      console.error("Error fetching user profile:", err)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("[v0] AUTH: Initializing...")

        const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

        if (isPublicRoute) {
          console.log("[v0] AUTH: Public route, skipping auth check")
          setIsLoading(false)
          setIsInitialized(true)
          return
        }

        // Primero intentar usar caché
        const { session: cachedSession, user: cachedUser } = getCachedSession()
        const cachedProfile = getCachedProfile()

        if (cachedSession && cachedUser && cachedProfile) {
          console.log("[v0] AUTH: Using cached session")
          setSession(cachedSession)
          setUser(cachedUser)
          setProfile(cachedProfile)
          setIsLoading(false)
          setIsInitialized(true)
          return
        }

        // Si no hay caché, verificar con Supabase
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("[v0] AUTH: Session error:", error)
          setSession(null)
          setUser(null)
          setProfile(null)
        } else if (session) {
          console.log("[v0] AUTH: Session found")
          setSession(session)
          setUser(session.user)

          // Guardar en caché
          cacheSession(session, session.user)

          const userProfile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted && userProfile) {
            setProfile(userProfile)
            // Guardar perfil en caché
            cacheProfile(userProfile)

            // Solo redirigir desde login
            if (pathname === "/login") {
              const dashboardRoute = getDashboardRoute(userProfile.role, userProfile.team_id)
              console.log("[v0] AUTH: Redirecting to:", dashboardRoute)
              router.push(dashboardRoute)
            }
          }
        } else {
          console.log("[v0] AUTH: No session found")
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error("[v0] AUTH: Init error:", err)
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
  }, [fetchUserProfile, getDashboardRoute, pathname, router])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] AUTH: State change:", event)

      if (event === "SIGNED_IN" && session) {
        setSession(session)
        setUser(session.user)
        setError(null)

        // Guardar en caché
        cacheSession(session, session.user)

        const userProfile = await fetchUserProfile(session.user.id, session.user.email)
        if (userProfile) {
          setProfile(userProfile)
          // Guardar perfil en caché
          cacheProfile(userProfile)

          if (pathname === "/login") {
            const dashboardRoute = getDashboardRoute(userProfile.role, userProfile.team_id)
            router.push(dashboardRoute)
          }
        }
      } else if (event === "SIGNED_OUT") {
        console.log("[v0] AUTH: Signed out")
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)

        // Limpiar caché
        clearAllCache()

        // Solo redirigir si no estamos en login
        if (pathname !== "/login") {
          router.push("/login")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, getDashboardRoute, pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("[v0] AUTH: Signing in...")

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        console.error("[v0] AUTH: Sign in error:", signInError)
        setError(signInError.message)
        return { error: signInError.message }
      }

      console.log("[v0] AUTH: Sign in successful")
      return { error: null }
    } catch (err: any) {
      console.error("[v0] AUTH: Sign in exception:", err)
      setError(err.message)
      return { error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log("[v0] AUTH: Signing out...")

      // Limpiar estado inmediatamente
      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)

      // Limpiar caché personalizado
      clearAllCache()

      // Cerrar sesión en Supabase
      await supabase.auth.signOut()

      // Limpiar localStorage
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      console.log("[v0] AUTH: Signed out successfully")

      // Redirigir usando window.location para forzar recarga completa
      window.location.href = "/login"
    } catch (err: any) {
      console.error("[v0] AUTH: Sign out error:", err)
      // En caso de error, forzar limpieza y redirección
      setSession(null)
      setUser(null)
      setProfile(null)
      clearAllCache()
      window.location.href = "/login"
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

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isInitialized, error, signIn, signOut, refreshProfile }}>
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
