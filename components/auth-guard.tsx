"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hasChecked, setHasChecked] = useState(false)

  const publicRoutes = ["/register", "/forgot-password", "/reset-password", "/primer-acceso", "/ranking-publico"]

  useEffect(() => {
    // Solo verificar una vez cuando esté inicializado
    if (!isInitialized || hasChecked) return

    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    console.log("AUTH-GUARD: Single check for route:", pathname, "Is public:", isPublicRoute)

    setHasChecked(true)

    // Para rutas públicas (excepto login), permitir acceso
    if (isPublicRoute) {
      console.log("AUTH-GUARD: Public route authorized")
      return
    }

    // Si estamos en login y hay sesión, redirigir
    if (pathname === "/login" && session && profile) {
      console.log("AUTH-GUARD: Redirecting from login to dashboard")
      const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
      router.replace(dashboardRoute)
      return
    }

    // Si estamos en login sin sesión, permitir
    if (pathname === "/login") {
      console.log("AUTH-GUARD: Login page authorized")
      return
    }

    // Para rutas protegidas sin sesión, redirigir a login
    if (!session || !profile) {
      console.log("AUTH-GUARD: No auth, redirecting to login")
      router.replace("/login")
      return
    }

    console.log("AUTH-GUARD: Protected route authorized")
  }, [isInitialized, hasChecked, session, profile, pathname, router])

  // Mostrar loading solo mientras se inicializa
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#006BA6]" />
            <h2 className="text-xl font-semibold text-gray-800">Cargando...</h2>
            <p className="text-center text-gray-600 text-sm">Verificando acceso...</p>
          </div>
        </div>
      </div>
    )
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Para rutas públicas, mostrar siempre
  if (isPublicRoute || pathname === "/login") {
    return <>{children}</>
  }

  // Para rutas protegidas, verificar autenticación
  if (!session || !profile) {
    return null // Se está redirigiendo
  }

  return <>{children}</>
}

function getDashboardRoute(role: string, teamId: string | null) {
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
