"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/primer-acceso",
  "/ranking-publico",
]

// Mapeo de roles a rutas permitidas
const roleRoutes: Record<string, string[]> = {
  admin: ["/admin"],
  capitan: ["/capitan"],
  director_tecnico: ["/director-tecnico"],
  arbitro: ["/director-tecnico"], // Árbitro usa las mismas rutas que director técnico
  supervisor: ["/supervisor"],
  representante: ["/representante"],
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      console.log(`ROUTE_GUARD: Checking auth for path: ${pathname}`)

      // Si la ruta es pública, permitir acceso
      if (publicRoutes.some((route) => pathname?.startsWith(route))) {
        console.log("ROUTE_GUARD: Public route, allowing access")
        setAuthorized(true)
        return
      }

      // Si no hay perfil y no estamos cargando, redirigir a login
      if (!profile && !isLoading) {
        console.log("ROUTE_GUARD: No profile and not loading, redirecting to login")
        setAuthorized(false)
        router.push("/login")
        return
      }

      // Si hay perfil, verificar si tiene acceso a la ruta
      if (profile) {
        const allowedRoutes = roleRoutes[profile.role] || []
        const hasAccess = allowedRoutes.some((route) => pathname?.startsWith(route))

        console.log(
          `ROUTE_GUARD: User role: ${profile.role}, allowed routes: ${allowedRoutes}, has access: ${hasAccess}`,
        )

        if (hasAccess) {
          setAuthorized(true)
        } else {
          // Si no tiene acceso, redirigir al dashboard correspondiente
          setAuthorized(false)
          const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
          console.log(`ROUTE_GUARD: No access, redirecting to: ${dashboardRoute}`)
          router.push(dashboardRoute)
        }
      }
    }

    checkAuth()
  }, [pathname, profile, isLoading, router])

  // Mostrar loading mientras se verifica la autorización
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 text-lg font-medium">Cargando...</p>
      </div>
    )
  }

  // Si está autorizado, mostrar los hijos
  return authorized ? <>{children}</> : null
}

// Función helper para obtener ruta de dashboard
const getDashboardRoute = (role: string, teamId?: string | null) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "capitan":
      return teamId ? "/capitan/dashboard" : "/capitan/crear-equipo"
    case "director_tecnico":
      return "/director-tecnico/dashboard"
    case "arbitro":
      return "/director-tecnico/dashboard"
    case "supervisor":
      return "/supervisor/dashboard"
    case "representante":
      return "/representante/dashboard"
    default:
      return "/login"
  }
}
