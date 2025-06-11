"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

type Props = {
  allowedRoles: string[]
  children: React.ReactNode
}

export function ProtectedLayout({ allowedRoles, children }: Props) {
  const { isLoading, profile, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo proceder cuando esté inicializado
    if (!isInitialized) return

    if (!profile) {
      console.log("PROTECTED: No profile, redirecting to login")
      router.replace("/login")
      return
    }

    if (!allowedRoles.includes(profile.role)) {
      console.log("PROTECTED: Role not allowed, redirecting to dashboard")
      const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
      router.replace(dashboardRoute)
      return
    }

    console.log("PROTECTED: Access granted for role:", profile.role)
  }, [isInitialized, profile, router, allowedRoles])

  // Mostrar loading mientras se inicializa
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Si no hay perfil, no mostrar nada (se está redirigiendo)
  if (!profile) {
    return null
  }

  // Si el rol no está permitido, no mostrar nada (se está redirigiendo)
  if (!allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}

function getDashboardRoute(role: string, hasTeam: boolean | string | null) {
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
    case "arbitro":
      return "/arbitro/dashboard"
    default:
      return "/login"
  }
}
