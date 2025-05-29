"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider" // Usar el useAuth del auth-provider
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/primer-acceso",
    "/ranking-publico",
  ]

  useEffect(() => {
    // Si aún no está inicializado, no hacemos nada
    if (!isInitialized) return

    const currentPath = window.location.pathname

    // Si estamos en una ruta pública, no necesitamos verificar autenticación
    if (publicRoutes.some((route) => currentPath.startsWith(route))) {
      return
    }

    // Si no está autenticado y no es una ruta pública, redirigir a login
    if (!user) {
      setIsRedirecting(true)
      console.log("🔄 AuthGuard: Redirigiendo a login - usuario no autenticado")
      router.push("/login")
      return
    }

    // Si se especificaron roles permitidos, verificar que el usuario tenga el rol correcto
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        setIsRedirecting(true)
        console.log(`🔄 AuthGuard: Acceso denegado - rol ${user.role} no permitido para esta ruta`)

        // Redirigir al dashboard apropiado según su rol
        const dashboardRoute = getDashboardRoute(user.role)
        router.push(dashboardRoute)
        return
      }
    }

    // Si el usuario es capitán y no ha creado equipo, redirigir a crear equipo
    if (user.role === "capitan" && !user.team_id && !currentPath.includes("/capitan/crear-equipo")) {
      setIsRedirecting(true)
      console.log("🔄 AuthGuard: Redirigiendo a capitán sin equipo a crear equipo")
      router.push("/capitan/crear-equipo")
      return
    }
  }, [user, isInitialized, router, allowedRoles])

  // Función para obtener la ruta del dashboard según el rol
  const getDashboardRoute = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard"
      case "capitan":
        return "/capitan/dashboard"
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

  // Si está en una ruta pública, no mostrar loading
  const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
  const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route))

  // Solo mostrar loading si no es una ruta pública y está cargando/redirigiendo
  if (!isPublicRoute && (isLoading || !isInitialized || isRedirecting)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-corteva-600 mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            {isRedirecting ? "Redirigiendo..." : "Verificando acceso..."}
          </p>
        </div>
      </div>
    )
  }

  // Si está en una ruta pública o está autenticado y autorizado, mostrar children
  return <>{children}</>
}
