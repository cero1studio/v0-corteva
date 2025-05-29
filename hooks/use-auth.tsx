"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

// Definir el tipo de perfil de usuario
type UserProfile = {
  id: string
  email: string
  role: string
  full_name?: string
  team_id?: string
  team_name?: string
  zone_id?: string
  distributor_id?: string
}

// Definir el tipo del contexto de autenticación
type AuthContextType = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  loadingMessage: string
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// Crear el contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor de autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Inicializando...")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/primer-acceso",
    "/ranking-publico",
  ]

  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

  // Función para obtener la ruta del dashboard según el rol
  const getDashboardRoute = (role: string, hasTeam = true) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard"
      case "capitan":
        return hasTeam ? "/capitan/dashboard" : "/capitan/crear-equipo"
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

  // Función para redireccionar solo cuando tengamos datos completos
  const redirectToDashboard = (userProfile: UserProfile) => {
    console.log(`Redirigiendo usuario con rol ${userProfile.role}`)

    const hasTeam = !!userProfile.team_id
    const dashboardRoute = getDashboardRoute(userProfile.role, hasTeam)

    console.log(`Redirigiendo a: ${dashboardRoute}`)
    setLoadingMessage("Redirigiendo al dashboard...")

    // Usar window.location.href para forzar la redirección
    if (typeof window !== "undefined") {
      window.location.href = dashboardRoute
    }
  }

  // Función para obtener el perfil del usuario
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log(`Obteniendo perfil para usuario: ${userId}`)
      setLoadingMessage("Cargando tu perfil...")

      // Consulta directa a la tabla profiles
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error al obtener perfil:", error)
        return null
      }

      if (!data) {
        console.error("No se encontró el perfil")
        return null
      }

      console.log("Perfil obtenido exitosamente:", data)

      // Obtener nombre del equipo si es capitán (opcional)
      let teamName = null
      if (data.role === "capitan" && data.team_id) {
        try {
          setLoadingMessage("Cargando información del equipo...")
          const { data: team } = await supabase.from("teams").select("name").eq("id", data.team_id).single()
          if (team) {
            teamName = team.name
          }
        } catch (err) {
          console.log("No se pudo obtener el nombre del equipo")
        }
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
        team_id: data.team_id,
        team_name: teamName,
        zone_id: data.zone_id,
        distributor_id: data.distributor_id,
      }
    } catch (error: any) {
      console.error("Error al obtener perfil:", error)
      return null
    }
  }

  // Función para refrescar el perfil
  const refreshProfile = async () => {
    if (!user) return

    const userProfile = await fetchUserProfile(user.id)
    if (userProfile) {
      setProfile(userProfile)
    }
  }

  // Función para esperar hasta tener datos completos
  const waitForCompleteData = async (sessionData: Session) => {
    console.log("Esperando datos completos...")
    setLoadingMessage("Verificando tu sesión...")

    let attempts = 0
    const maxAttempts = 10 // Máximo 30 segundos (10 intentos x 3 segundos)

    const checkData = async (): Promise<boolean> => {
      attempts++
      console.log(`Intento ${attempts}/${maxAttempts} para obtener datos completos`)
      setLoadingMessage(`Cargando datos (${attempts}/${maxAttempts})...`)

      // Verificar que la sesión sigue siendo válida
      const { data: currentSession } = await supabase.auth.getSession()
      if (!currentSession?.session) {
        console.log("Sesión perdida durante la espera")
        setLoadingMessage("Sesión perdida, reintentando...")
        return false
      }

      // Intentar obtener el perfil
      const userProfile = await fetchUserProfile(sessionData.user.id)

      if (userProfile) {
        console.log("Datos completos obtenidos!")
        setLoadingMessage("¡Datos cargados exitosamente!")
        setSession(sessionData)
        setUser(sessionData.user)
        setProfile(userProfile)
        setError(null)
        setIsLoading(false)

        // Solo redirigir si estamos en login
        if (pathname === "/login") {
          redirectToDashboard(userProfile)
        }

        return true
      }

      return false
    }

    // Intentar inmediatamente
    const success = await checkData()
    if (success) return

    // Si no funciona, esperar e intentar cada 3 segundos
    const interval = setInterval(async () => {
      const success = await checkData()

      if (success || attempts >= maxAttempts) {
        clearInterval(interval)

        if (!success) {
          console.error("No se pudieron obtener los datos después de varios intentos")
          setError("No se pudo cargar tu perfil. Por favor, recarga la página.")
          setLoadingMessage("Error al cargar datos")
          setIsLoading(false)
        }
      }
    }, 3000)
  }

  // Inicializar autenticación
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        console.log("Inicializando autenticación...")
        setLoadingMessage("Inicializando aplicación...")

        // Obtener sesión actual
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Error al obtener sesión:", error)
          setLoadingMessage("Error de conexión")
          if (!isPublicRoute) {
            // Solo redirigir a login si estamos en una ruta protegida
            if (typeof window !== "undefined") {
              window.location.href = "/login"
            }
          }
          setIsLoading(false)
          return
        }

        if (data?.session) {
          console.log("Sesión encontrada, esperando datos completos...")
          setLoadingMessage("Sesión encontrada, cargando datos...")
          // Esperar hasta tener datos completos
          await waitForCompleteData(data.session)
        } else {
          console.log("No hay sesión activa")
          setLoadingMessage("No hay sesión activa")
          if (!isPublicRoute) {
            // Solo redirigir a login si estamos en una ruta protegida
            if (typeof window !== "undefined") {
              window.location.href = "/login"
            }
          }
          setIsLoading(false)
        }
      } catch (error: any) {
        console.error("Error de inicialización:", error)
        setError(error.message)
        setLoadingMessage("Error de inicialización")
        setIsLoading(false)
      }
    }

    initAuth()

    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" && session) {
        console.log("Usuario autenticado, esperando datos completos...")
        setLoadingMessage("Autenticación exitosa, cargando datos...")
        setError(null)
        setIsLoading(true)

        // Esperar hasta tener datos completos
        await waitForCompleteData(session)
      } else if (event === "SIGNED_OUT") {
        console.log("Usuario desconectado")
        setLoadingMessage("Cerrando sesión...")
        setSession(null)
        setUser(null)
        setProfile(null)
        setError(null)
        setIsLoading(false)

        if (!isPublicRoute) {
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [isPublicRoute, pathname])

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setLoadingMessage("Iniciando sesión...")
      setError(null)

      console.log("Iniciando sesión con:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Error de login:", error)
        setError(error.message)
        setLoadingMessage("Error en el login")
        setIsLoading(false)
        return { error: error.message }
      }

      console.log("Login exitoso, esperando datos completos...")
      setLoadingMessage("Login exitoso, cargando datos...")
      // El loading se mantiene hasta que tengamos datos completos
      return { error: null }
    } catch (error: any) {
      console.error("Error en signIn:", error)
      setError(error.message)
      setLoadingMessage("Error de conexión")
      setIsLoading(false)
      return { error: error.message }
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      setIsLoading(true)
      setLoadingMessage("Cerrando sesión...")
      console.log("Cerrando sesión...")

      await supabase.auth.signOut()

      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue = {
    session,
    user,
    profile,
    isLoading,
    loadingMessage,
    error,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
