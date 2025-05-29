"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session } from "@supabase/supabase-js"

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
  user: UserProfile | null
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
  const [user, setUser] = useState<UserProfile | null>(null)
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

  const getDashboardRoute = (role: string, teamId?: string | null) => {
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
  }

  const fetchUserProfile = async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    try {
      console.log(`AUTH_PROVIDER: Fetching profile for user: ${userId}`)

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, team_id, zone_id, distributor_id")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("AUTH_PROVIDER: Error fetching profile:", error)
        return null
      }

      if (!data) {
        console.error("AUTH_PROVIDER: No profile data found")
        return null
      }

      // Obtener nombre del equipo si es capitán
      let teamName = null
      if (data.role === "capitan" && data.team_id) {
        try {
          const { data: teamData } = await supabase.from("teams").select("name").eq("id", data.team_id).single()

          if (teamData) {
            teamName = teamData.name
          }
        } catch (teamError) {
          console.warn("AUTH_PROVIDER: Could not fetch team name:", teamError)
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
    } catch (err) {
      console.error("AUTH_PROVIDER: Exception fetching profile:", err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        console.log("AUTH_PROVIDER: Initializing...")

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("AUTH_PROVIDER: Session error:", error)
          setSession(null)
          setUser(null)
        } else if (session) {
          console.log("AUTH_PROVIDER: Session found")
          setSession(session)

          const profile = await fetchUserProfile(session.user.id, session.user.email)
          if (mounted && profile) {
            setUser(profile)

            // Redirección solo desde login
            if (pathname === "/login") {
              const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
              console.log(`AUTH_PROVIDER: Redirecting to ${dashboardRoute}`)
              router.replace(dashboardRoute)
            }
          }
        } else {
          console.log("AUTH_PROVIDER: No session")
          setSession(null)
          setUser(null)
        }
      } catch (err) {
        console.error("AUTH_PROVIDER: Init error:", err)
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log(`AUTH_PROVIDER: Auth event: ${event}`)

      if (event === "SIGNED_IN" && session) {
        setSession(session)
        const profile = await fetchUserProfile(session.user.id, session.user.email)
        if (profile) {
          setUser(profile)
          const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
          router.replace(dashboardRoute)
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setError(null)
        router.replace("/login")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return { error: error.message }
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
    } catch (err) {
      console.error("AUTH_PROVIDER: Sign out error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!session?.user) return

    const profile = await fetchUserProfile(session.user.id, session.user.email)
    if (profile) {
      setUser(profile)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isInitialized,
        error,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
