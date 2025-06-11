"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/primer-acceso",
    "/ranking-publico",
  ]

  useEffect(() => {
    // Solo proceder cuando esté inicializado
    if (!isInitialized) return

    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    console.log("AUTH-GUARD: Checking route:", pathname, "Is public:", isPublicRoute)

    if (isPublicRoute) {
      console.log("AUTH-GUARD: Public route, authorizing immediately")
      return
    }

    if (!session || !profile) {
      console.log("AUTH-GUARD: No session/profile, redirecting to login")
      router.replace("/login")
      return
    }

    // Si estamos en login y tenemos sesión, redirigir al dashboard
    if (pathname === "/login" && session && profile) {
      console.log("AUTH-GUARD: Logged in user on login page, redirecting to dashboard")
      const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
      router.replace(dashboardRoute)
      return
    }

    console.log("AUTH-GUARD: Access granted")
  }, [isInitialized, session, profile, pathname, router])

  // Mostrar loading mientras se inicializa
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Para rutas públicas, mostrar siempre
  if (isPublicRoute) {
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
