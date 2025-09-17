"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"
import { getCachedSessionForced, getCachedProfileForced } from "@/lib/session-cache"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/primer-acceso", "/ranking-publico"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isInitialized, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

  // Autorización inmediata para rutas públicas
  useEffect(() => {
    if (isPublicRoute) {
      console.log("AUTH-GUARD: Public route, authorizing immediately")
      setIsAuthorized(true)
      return
    }
  }, [isPublicRoute])

  // Lógica de autorización para rutas privadas
  useEffect(() => {
    if (isPublicRoute) return

    if (!isInitialized) {
      // Si no está inicializado, verificar caché
      const { session: cachedSession } = getCachedSessionForced()
      const cachedProfile = getCachedProfileForced()

      if (cachedSession && cachedProfile) {
        console.log("AUTH-GUARD: Found cache, authorizing")
        setIsAuthorized(true)
      }
      return
    }

    // Una vez inicializado, verificar usuario y perfil
    if (user && profile) {
      console.log("AUTH-GUARD: User and profile found, authorizing")
      setIsAuthorized(true)
    } else if (!hasRedirected) {
      console.log("AUTH-GUARD: No user/profile, redirecting to login")
      setHasRedirected(true)
      router.push("/login")
    }
  }, [user, profile, isInitialized, isPublicRoute, hasRedirected, router])

  // Timeout para mostrar fallback
  useEffect(() => {
    if (isPublicRoute || isAuthorized) return

    const timer = setTimeout(() => {
      if (!isAuthorized && !hasRedirected) {
        setShowFallback(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [isAuthorized, hasRedirected, isPublicRoute])

  // Si es ruta pública o está autorizado, mostrar contenido
  if (isPublicRoute || isAuthorized) {
    return <>{children}</>
  }

  // Si ya redirigió, no mostrar nada
  if (hasRedirected) {
    return null
  }

  // Mostrar loading
  if (!isInitialized || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#006BA6]" />
            <h2 className="text-xl font-semibold text-gray-800">Verificando acceso...</h2>

            {showFallback && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm mb-3">¿La página no carga?</p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      const { session: cachedSession } = getCachedSessionForced()
                      const cachedProfile = getCachedProfileForced()

                      if (cachedSession && cachedProfile) {
                        setIsAuthorized(true)
                      } else {
                        router.push("/login")
                      }
                    }}
                    className="px-4 py-2 bg-[#006BA6] text-white rounded-md hover:bg-[#005a8b] text-sm font-medium"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
                  >
                    Ir al inicio de sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
