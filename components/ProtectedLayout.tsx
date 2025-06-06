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
  const { isLoading, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!profile) {
        router.replace("/login")
      } else if (!allowedRoles.includes(profile.role)) {
        router.replace(getDashboardRoute(profile.role, !!profile.team_id))
      }
    }
  }, [isLoading, profile, router, allowedRoles])

  if (isLoading || !profile || !allowedRoles.includes(profile.role)) {
    return null // O puedes usar un <Loader />
  }

  return <>{children}</>
}

function getDashboardRoute(role: string, hasTeam: boolean) {
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
      return "/director-tecnico/dashboard"
    default:
      return "/login"
  }
}
