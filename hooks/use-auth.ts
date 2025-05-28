"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

type UserProfile = {
  id: string
  email: string
  role: string
  full_name?: string
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ["/login"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Función simple para obtener perfil
  const getProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from("profiles").select("id, email, role, full_name").eq("id", userId).single()
      return data
    } catch {
      return null
    }
  }

  // Inicialización simple
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setSession(session)
        setUser(session.user)

        const userProfile = await getProfile(session.user.id)
        if (userProfile) {
          setProfile(userProfile)
        }

        // Solo redirigir si estamos en login
        if (pathname === "/login") {
          router.push("/admin/dashboard")
        }
      } else if (!isPublicRoute) {
        router.push("/login")
      }

      setIsLoading(false)
    }

    init()

    // Listener simple
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setSession(session)
        setUser(session.user)

        const userProfile = await getProfile(session.user.id)
        if (userProfile) {
          setProfile(userProfile)
        }

        router.push("/admin/dashboard")
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
        setProfile(null)
        router.push("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, isPublicRoute])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message || null }
    } catch (error: any) {
      return { error: error.message || "Error al iniciar sesión" }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signIn, signOut }}>
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
