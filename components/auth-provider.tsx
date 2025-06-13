"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

import {
  cacheSession,
  cacheProfile,
  clearAllCache,
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
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ["/login", "/primer-acceso", "/ranking-publico"]

  const fetchUserProfile = useCallback(async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, team_id, zone_id, distributor_id")
        .eq("id", userId)
        .single()

      if (profileError || !data) {
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
      return null
    }
  }, [])

  // Inicialización simple
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar caché primero
        const { session: cachedSession, user: cachedUser } = getCachedSessionForced()
        const cachedProfile = getCachedProfileForced()

        if (cachedSession && cachedUser && cachedProfile) {
          setSession(cachedSession)
          setUser(cachedUser)
          setProfile(cachedProfile)
          setIsInitialized(true)
          return
        }

        // Si no hay caché, verificar sesión
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          setSession(session)
          setUser(session.user)
          cacheSession(session, session.user)

          const userProfile = await fetchUserProfile(session.user.id, session.user.email)
          if (userProfile) {
            setProfile(userProfile)
            cacheProfile(userProfile)
          }
        }
      } catch (err) {
        console.error("Auth init error:", err)
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [fetchUserProfile])

  // Listener de cambios de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setSession(session)
        setUser(session.user)
        setError(null)
        cacheSession(session, session.user)

        const userProfile = await fetchUserProfile(session.user.id, session.user.email)
        if (userProfile) {
          setProfile(userProfile)
          cacheProfile(userProfile)
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
        clearAllCache()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        return { error: signInError.message }
      }
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      clearAllCache()
      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)

      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (err: any) {
      window.location.href = "/login"
    }
  }

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const userProfile = await fetchUserProfile(user.id, user.email)
    if (userProfile) {
      setProfile(userProfile)
      cacheProfile(userProfile)
    }
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
