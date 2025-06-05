"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
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
  arbitro: ["/director-tecnico"],
  supervisor: ["/supervisor"],
  representante: ["/representante"],
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Verificar autorización cuando cambia la ruta o el perfil
    const checkAuth = () => {
      // Si la ruta es pública, permitir acceso
      if (publicRoutes.some((route) => pathname?.startsWith(route))) {
        setAuthorized(true)
        return
      }

      // Si no hay perfil y no estamos cargando, redirigir a login
      if (!user && !isLoading) {
        setAuthorized(false)
        router.push("/login")
        return
      }

      // Si hay perfil, verificar si tiene acceso a la ruta
      if (user) {
        const allowedRoutes = roleRoutes[user.role] || []
        const hasAccess = allowedRoutes.some((route) => pathname?.startsWith(route))

        if (hasAccess) {
          setAuthorized(true)
        } else {
          // Si no tiene acceso, redirigir al dashboard correspondiente
          setAuthorized(false)
          if (user.role === "capitan" && !user.team_id) {
            router.push("/capitan/crear-equipo")
          } else {
            const dashboardRoute = `/${user.role}/dashboard`
            router.push(dashboardRoute)
          }
        }
      }
    }

    checkAuth()
  }, [pathname, user, isLoading, router])

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
