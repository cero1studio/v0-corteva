"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/router"

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: any | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface Props {
  children: ReactNode
}

export const AuthProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        await getProfile(session.user.id)
      }

      setLoading(false)
    }

    getSession()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      if (session?.user) {
        await getProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })
  }, [])

  const getProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, team_id, zone_id, distributor_id")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
      }

      setProfile(profileData)
    } catch (error) {
      console.error("Unexpected error fetching profile:", error)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
      alert("Check your email for the confirmation link.")
    } catch (error: any) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearAllCache = () => {
    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }
      await supabase.auth.signOut()
    } catch (err: any) {
      console.error("AUTH: Error signing out:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      setLoading(true)
      const { error } = await supabase.from("profiles").upsert({
        id: user?.id,
        ...updates,
      })
      if (error) throw error
      alert("Profile updated!")
      await getProfile(user?.id as string) // Refresh profile data
    } catch (error: any) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  const value = { session, user, profile, loading, signUp, signIn, signOut, updateProfile }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
