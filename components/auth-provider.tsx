"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Define the shape of the user profile
type UserProfile = {
  id: string
  email: string
  role: string
  name?: string
  team_id?: string
  has_created_team?: boolean
}

// Define the shape of the auth context
type AuthContextType = {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create the auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create the Supabase client
  const supabase = createClientComponentClient<Database>()

  // Initialize the auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError.message)
          setError(sessionError.message)
          setIsInitialized(true)
          return
        }

        setSession(sessionData.session)

        // If there's a session, get the user profile
        if (sessionData.session) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sessionData.session.user.id)
            .single()

          if (profileError) {
            console.error("Error getting profile:", profileError.message)
            setError(profileError.message)
            setIsInitialized(true)
            return
          }

          // Check if the user has created a team (for captains)
          let hasCreatedTeam = false
          if (profileData.role === "capitan" && profileData.team_id) {
            const { data: teamData } = await supabase.from("teams").select("id").eq("id", profileData.team_id).single()
            hasCreatedTeam = !!teamData
          }

          // Set the user profile
          setUser({
            id: sessionData.session.user.id,
            email: sessionData.session.user.email || "",
            role: profileData.role,
            name: profileData.name,
            team_id: profileData.team_id,
            has_created_team: hasCreatedTeam,
          })
        }

        // Set up the auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("Auth state change:", event)
          setSession(newSession)

          if (event === "SIGNED_IN" && newSession) {
            setIsLoading(true)
            try {
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", newSession.user.id)
                .single()

              if (profileError) {
                console.error("Error getting profile:", profileError.message)
                setError(profileError.message)
                setIsLoading(false)
                return
              }

              // Check if the user has created a team (for captains)
              let hasCreatedTeam = false
              if (profileData.role === "capitan" && profileData.team_id) {
                const { data: teamData } = await supabase
                  .from("teams")
                  .select("id")
                  .eq("id", profileData.team_id)
                  .single()
                hasCreatedTeam = !!teamData
              }

              // Set the user profile
              setUser({
                id: newSession.user.id,
                email: newSession.user.email || "",
                role: profileData.role,
                name: profileData.name,
                team_id: profileData.team_id,
                has_created_team: hasCreatedTeam,
              })
            } catch (error) {
              console.error("Error in auth state change:", error)
              setError("Error al obtener el perfil de usuario")
            } finally {
              setIsLoading(false)
            }
          } else if (event === "SIGNED_OUT") {
            setUser(null)
          }
        })

        setIsInitialized(true)
        return () => {
          authListener.subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setError("Error al inicializar la autenticación")
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [supabase])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("Error signing in:", signInError.message)
        setError(
          signInError.message === "Invalid login credentials"
            ? "Credenciales inválidas. Por favor verifica tu correo y contraseña."
            : signInError.message,
        )
        return { error: signInError.message }
      }

      // Get the user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user?.id)
        .single()

      if (profileError) {
        console.error("Error getting profile:", profileError.message)
        setError(profileError.message)
        return { error: profileError.message }
      }

      // Check if the user has created a team (for captains)
      let hasCreatedTeam = false
      if (profileData.role === "capitan" && profileData.team_id) {
        const { data: teamData } = await supabase.from("teams").select("id").eq("id", profileData.team_id).single()
        hasCreatedTeam = !!teamData
      }

      // Set the user profile
      setUser({
        id: data.user?.id || "",
        email: data.user?.email || "",
        role: profileData.role,
        name: profileData.name,
        team_id: profileData.team_id,
        has_created_team: hasCreatedTeam,
      })

      return { error: null }
    } catch (error) {
      console.error("Error in signIn:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al iniciar sesión"
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Error al cerrar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  // Return the auth context provider
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isInitialized,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Create the auth hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
