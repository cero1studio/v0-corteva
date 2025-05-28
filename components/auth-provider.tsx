"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

type User = {
  id: string
  email: string
  name?: string
  role: string
}

type AuthContextType = {
  user: User | null
  userRole: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isPublicRoute = pathname === "/login"

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: profile.full_name || session.user.email?.split("@")[0],
            role: profile.role,
          })
          setUserRole(profile.role)

          if (pathname === "/login") {
            router.push("/admin/dashboard")
          }
        }
      } else if (!isPublicRoute) {
        router.push("/login")
      }

      setIsLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
        setUserRole(null)
        router.push("/login")
      } else if (event === "SIGNED_IN" && session) {
        init()
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, isPublicRoute])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message || null }
    } catch (error: any) {
      return { error: error?.message || "Error al iniciar sesión" }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Loading simple
  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, userRole, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
