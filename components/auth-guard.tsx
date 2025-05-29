"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/primer-acceso"]

  useEffect(() => {
    // Si aún no está inicializado, no hacemos nada
    if (!isInitialized) return

    const currentPath = window.location.pathname

    // Si estamos en una ruta pública, no necesitamos redireccionar ni mostrar loading
    if (publicRoutes.some((route) => currentPath.startsWith(route))) {
      // Si el usuario está autenticado y está en login, redirigir al dashboard
      if (user && currentPath === "/login") {
        setIsRedirecting(true)
        const dashboardRoute = getDashboardRoute(user.role)
        console.log("🔄 Redirigiendo a usuario autenticado desde login a:", dashboardRoute)
        router.push(dashboardRoute)
      }
      return
    }

    // Si no está autenticado y no es una ruta pública, redirigir a login
    if (!user) {
      setIsRedirecting(true)
      console.log("🔄 Redirigiendo a login: usuario no autenticado")
      router.push("/login")
      return
    }

    // Redirecciones basadas en rol
    const dashboardRoute = getDashboardRoute(user.role)

    // Si el usuario es capitán y no ha creado equipo, redirigir a crear equipo
    if (user.role === "capitan" && !user.team_id && !currentPath.includes("/capitan/crear-equipo")) {
      setIsRedirecting(true)
      console.log("AUTH_GUARD: Redirigiendo a capitán sin equipo (team_id missing) a crear equipo")
      router.push("/capitan/crear-equipo")
      return
    }

    // Si el usuario está en una ruta que no corresponde a su rol, redirigir al dashboard
    if (!currentPath.includes(`/${user.role}`) && !currentPath.startsWith("/crear-equipo")) {
      setIsRedirecting(true)
      console.log(`🔄 Redirigiendo a ${dashboardRoute}: ruta incorrecta para rol ${user.role}`)
      router.push(dashboardRoute)
      return
    }
  }, [user, isInitialized, router])

  // Función para obtener la ruta del dashboard según el rol
  const getDashboardRoute = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard"
      case "capitan":
        return "/capitan/dashboard"
      case "director_tecnico":
        return "/director-tecnico/dashboard"
      default:
        return "/login"
    }
  }

  // Si está en una ruta pública, no mostrar loading
  const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
  const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route))

  // Solo mostrar loading si no es una ruta pública y está cargando/redirigiendo
  if (!isPublicRoute && (isLoading || !isInitialized || isRedirecting)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600 text-lg font-medium">{isRedirecting ? "Redirigiendo..." : "Cargando..."}</p>
        </div>
      </div>
    )
  }

  // Si está en una ruta pública o está autenticado y en la ruta correcta, mostrar children
  return <>{children}</>
}
