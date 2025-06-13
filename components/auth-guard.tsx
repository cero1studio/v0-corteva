"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

const publicRoutes = ["/login", "/primer-acceso", "/ranking-publico"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isInitialized } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

  useEffect(() => {
    if (!isInitialized) return

    if (!isPublicRoute && (!user || !profile)) {
      router.push("/login")
    }
  }, [user, profile, isInitialized, isPublicRoute, router])

  // Para rutas públicas, mostrar siempre
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Para rutas privadas, verificar autenticación
  if (!isInitialized || !user || !profile) {
    return null // No mostrar nada mientras se verifica
  }

  return <>{children}</>
}
