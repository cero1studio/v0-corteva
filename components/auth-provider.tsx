"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

// Tipado del perfil
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
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, team_id, zone_id, distributor_id")
            .eq("id", userId)
            .single()

          if (profileError || !data) {
            if (attempt === retries - 1) {
              setError(profileError?.message || "Perfil no encontrado")
              return null
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
            continue
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
          if (attempt === retries - 1) {
            setError(err.message)
            return null
          }
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

      console.log("AUTH: Current path:", currentPath, "Dashboard route:", dashboardRoute)

      // Solo redirigir desde login o si está en ruta incorrecta para su rol
      if (currentPath === "/login") {
        console.log("AUTH: Redirecting from login to dashboard")
        setTimeout(() => router.replace(dashboardRoute), 100)
      } else if (userProfile.role === "capitan" && !userProfile.team_id && currentPath !== "/capitan/crear-equipo") {
        console.log("AUTH: Captain without team, redirecting to create team")
        setTimeout(() => router.replace("/capitan/crear-equipo"), 100)
      }
    },
    [pathname, getDashboardRoute, router],
  )

  useEffect(() => {
    let mounted = true
    let initTimeout: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        // Timeout para evitar loading infinito
        initTimeout = setTimeout(() => {
          if (mounted) {
            console.log("AUTH: Timeout reached, setting initialized")
            setIsLoading(false)
            setIsInitialized(true)
          }
        }, 5000)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        clearTimeout(initTimeout)

        if (error) {
          console.error("AUTH: Session error:", error)
          setSession(null)
          setUser(null)
          setProfile(null)
        } else if (session) {
          console.log("AUTH: Session found, fetching profile")
          setSession(session)
          setUser(session.user)

          const userProfile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted && userProfile) {
            setProfile(userProfile)
            // Solo redirigir si estamos en login
            if (pathname === "/login") {
              handleRedirection(userProfile)
            }
          }
        } else {
          console.log("AUTH: No session found")
          setSession(null)
          setUser(null)
          setProfile(null)

          // Solo redirigir a login si no estamos en rutas públicas
          const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))
          if (!isPublicRoute && pathname !== "/login") {
            console.log("AUTH: Redirecting to login from private route")
            setTimeout(() => router.replace("/login"), 100)
          }
        }
      } catch (err) {
        console.error("AUTH Init Error:", err)
        if (initTimeout) clearTimeout(initTimeout)
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
      if (initTimeout) clearTimeout(initTimeout)
    }
  }, [fetchUserProfile, handleRedirection, pathname, router])

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
          // Solo redirigir en login exitoso
          if (pathname === "/login") {
            handleRedirection(userProfile)
          }
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)

        // Solo redirigir a login si no estamos ya ahí
        if (pathname !== "/login") {
          console.log("AUTH: Signed out, redirecting to login")
          setTimeout(() => router.replace("/login"), 100)
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log("AUTH: Token refreshed")
        setSession(session)
        setUser(session.user)
        // No redirigir en refresh de token
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, handleRedirection, pathname, router])

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
      setIsLoading(true)
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
    if (userProfile) setProfile(userProfile)
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
