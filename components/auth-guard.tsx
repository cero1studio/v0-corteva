"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/primer-acceso", "/ranking-publico"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Si aún no se ha inicializado la autenticación, no hacemos nada
    if (!isInitialized) return

    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

    if (isPublicRoute) {
      // Si es una ruta pública, permitir acceso sin importar el estado de autenticación
      setIsAuthorized(true)
    } else if (!user) {
      // Si no es una ruta pública y no hay usuario autenticado, redirigir a login
      router.replace("/login")
    } else {
      // Si hay un usuario autenticado, permitir acceso
      setIsAuthorized(true)
    }
  }, [user, pathname, router, isInitialized])

  // Mientras se verifica la autorización, no mostrar nada
  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  // Si está autorizado, mostrar los children
  return isAuthorized ? (
    <>{children}</>
  ) : (
    <div className="flex items-center justify-center min-h-screen">Verificando acceso...</div>
  )
}
