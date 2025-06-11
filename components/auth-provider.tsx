"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClientSupabaseClient } from "@/lib/supabase/client" // Importa el cliente singleton
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getClientSupabaseClient() // Usa el cliente singleton
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)

      // Lógica opcional de redirección basada en el estado de autenticación
      if (_event === "SIGNED_OUT") {
        router.push("/login")
      } else if (_event === "SIGNED_IN" && window.location.pathname === "/login") {
        router.push("/") // O un dashboard por defecto
      }
    })

    // Verificación de sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router]) // Depende de supabase para asegurar que el efecto se ejecute si el cliente cambia (aunque no debería con singleton)

  return <AuthContext.Provider value={{ user, session, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
