"use client"

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { getErrorMessage } from "@/lib/auth-errors"

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

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isInitialized = status !== "loading"

  // Mapear la sesión de NextAuth al formato esperado por la aplicación
  const user = useMemo(() => {
    return session?.user
      ? {
          id: session.user.id,
          email: session.user.email || "",
          aud: "authenticated",
          role: "authenticated",
          email_confirmed_at: new Date().toISOString(),
          phone: "",
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : null
  }, [session?.user])

  const profile: UserProfile | null = useMemo(() => {
    return session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          full_name: session.user.name || undefined,
          team_id: session.user.team_id,
          team_name: session.user.team_name,
          zone_id: session.user.zone_id,
          distributor_id: session.user.distributor_id,
        }
      : null
  }, [session?.user])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await nextAuthSignIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          // Mapear c?digos de error a mensajes en espa?ol
          const errorMessage = getErrorMessage(result.error)
          return { error: errorMessage }
        }

        if (result?.ok) {
          // La redirecci?n se manejar? por el middleware o el componente
          return { error: null }
        }

        return { error: "Error desconocido al iniciar sesi?n" }
      } catch (error: any) {
        console.error("Error en signIn:", error)
        return { error: "Error al iniciar sesi?n. Intenta nuevamente." }
      }
    },
    [],
  )

  const signOut = useCallback(async () => {
    try {
      console.log("[AUTH] Signing out...")
      await nextAuthSignOut({ redirect: false })
      
      // Limpiar localStorage si existe
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Forzar recarga completa para limpiar todo el estado
      window.location.href = "/login"
    } catch (error) {
      console.error("Error en signOut:", error)
      // Incluso si hay error, forzar limpieza y redirecci?n
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = "/login"
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    // NextAuth maneja la actualizaci?n de la sesi?n autom?ticamente
    // Si necesitas forzar una actualizaci?n, puedes usar update() de useSession
    console.log("refreshProfile called - NextAuth maneja esto autom?ticamente")
  }, [])

  const mappedSession = useMemo(() => {
    return session ? { ...session, user } : null
  }, [session, user])

  return {
    session: mappedSession,
    user,
    profile,
    isLoading,
    isInitialized,
    error: null,
    signIn,
    signOut,
    refreshProfile,
  }
}
