"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

type Props = {
  allowedRoles?: string[]
  children: React.ReactNode
}

export function AuthGuard({ allowedRoles, children }: Props) {
  const { profile, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [shouldRender, setShouldRender] = useState(false)

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/primer-acceso",
    "/ranking-publico",
  ]

  useEffect(() => {
    // No hacer nada hasta que esté inicializado
    if (!isInitialized) return

    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

    // Si es ruta pública, permitir acceso
    if (isPublicRoute) {
      setShouldRender(true)
      return
    }

    // Si no hay perfil en ruta privada, redirigir a login
    if (!profile) {
      console.log("AUTH_GUARD: No profile, redirecting to login")
      router.replace("/login")
      setShouldRender(false)
      return
    }

    // Si hay roles específicos requeridos, verificar
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      console.log("AUTH_GUARD: Role not allowed, redirecting to dashboard")
      const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
      router.replace(dashboardRoute)
      setShouldRender(false)
      return
    }

    // Todo OK, renderizar
    setShouldRender(true)
  }, [isInitialized, profile, pathname, allowedRoles, router])

  // Mostrar loading mientras no esté inicializado o esté cargando
  if (!isInitialized || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 text-lg font-medium">Cargando...</p>
      </div>
    )
  }

  return shouldRender ? <>{children}</> : null
}

function getDashboardRoute(role: string, teamId?: string | null) {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "capitan":
      return teamId ? "/capitan/dashboard" : "/capitan/crear-equipo"
    case "director_tecnico":
      return "/director-tecnico/dashboard"
    case "supervisor":
      return "/supervisor/dashboard"
    case "representante":
      return "/representante/dashboard"
    case "arbitro":
      return "/arbitro/dashboard"
    default:
      return "/login"
  }
}
