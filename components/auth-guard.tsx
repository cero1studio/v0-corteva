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
  const [isRedirecting, setIsRedirecting] = useState(false)

  const publicRoutes = ["/register", "/forgot-password", "/reset-password", "/primer-acceso", "/ranking-publico"]

  useEffect(() => {
    // Solo proceder cuando esté inicializado
    if (!isInitialized) return

    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    console.log("AUTH-GUARD: Checking route:", pathname, "Is public:", isPublicRoute)
    console.log("AUTH-GUARD: Session:", !!session, "Profile:", !!profile)

    // Para rutas públicas (excepto login), permitir acceso
    if (isPublicRoute) {
      console.log("AUTH-GUARD: Public route, authorizing immediately")
      return
    }

    // Si estamos en login
    if (pathname === "/login") {
      // Si hay sesión y perfil, redirigir al dashboard
      if (session && profile) {
        console.log("AUTH-GUARD: Authenticated user on login page, redirecting to dashboard")
        setIsRedirecting(true)
        const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
        console.log("AUTH-GUARD: Redirecting to:", dashboardRoute)

        // Usar window.location para forzar la navegación
        if (typeof window !== "undefined") {
          window.location.href = dashboardRoute
        } else {
          router.replace(dashboardRoute)
        }
        return
      }

      // Si no hay sesión, permitir acceso a login
      console.log("AUTH-GUARD: No session, allowing access to login")
      return
    }

    // Para rutas protegidas, verificar autenticación
    if (!session || !profile) {
      console.log("AUTH-GUARD: No session/profile, redirecting to login")
      setIsRedirecting(true)
      router.replace("/login")
      return
    }

    console.log("AUTH-GUARD: Access granted to protected route")
  }, [isInitialized, session, profile, pathname, router])

  // Mostrar loading mientras se inicializa o está redirigiendo
  if (!isInitialized || isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#006BA6]" />
            <h2 className="text-xl font-semibold text-gray-800">{isRedirecting ? "Redirigiendo..." : "Cargando..."}</h2>
            <p className="text-center text-gray-600 text-sm">
              {isRedirecting ? "Te estamos llevando a tu dashboard" : "Verificando acceso..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Para rutas públicas (excepto login), mostrar siempre
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Para login, mostrar solo si no hay sesión
  if (pathname === "/login") {
    if (session && profile) {
      return null // Se está redirigiendo
    }
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
