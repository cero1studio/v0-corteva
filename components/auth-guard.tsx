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
  const [quickResolved, setQuickResolved] = useState(false)

  // Resolución inmediata para URLs directas usando caché
  useEffect(() => {
    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

    if (isPublicRoute) {
      console.log("AUTH-GUARD: Public route, authorizing immediately")
      setIsAuthorized(true)
      setQuickResolved(true)
      return
    }

    // Para rutas privadas, verificar caché inmediatamente
    const { session: cachedSession } = getCachedSessionForced()
    const cachedProfile = getCachedProfileForced()

    if (cachedSession && cachedProfile) {
      console.log("AUTH-GUARD: Found cache, authorizing immediately")
      setIsAuthorized(true)
      setQuickResolved(true)
      return
    }

    // Si no hay caché y no es ruta pública, esperar un poco antes de decidir
    const quickTimeout = setTimeout(() => {
      if (!isInitialized && !isAuthorized) {
        console.log("AUTH-GUARD: No cache and not initialized, redirecting to login")
        router.push("/login")
      }
    }, 2000) // Solo 2 segundos para URLs directas sin caché

    return () => clearTimeout(quickTimeout)
  }, [pathname, router, isInitialized, isAuthorized])

  // Timeout para mostrar fallback solo si no se resolvió r��pido
  useEffect(() => {
    if (quickResolved) return

    const timer = setTimeout(() => {
      if (!isInitialized && !isAuthorized) {
        setShowFallback(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isInitialized, isAuthorized, quickResolved])

  // Lógica normal de autorización cuando el auth provider esté listo
  useEffect(() => {
    if (!isInitialized) return

    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

    if (isPublicRoute) {
      setIsAuthorized(true)
    } else if (!user || !profile) {
      // Verificar caché una vez más
      const { session: cachedSession } = getCachedSessionForced()
      const cachedProfile = getCachedProfileForced()

      if (cachedSession && cachedProfile) {
        console.log("AUTH-GUARD: Using cache after auth provider ready")
        setIsAuthorized(true)
      } else {
        console.log("AUTH-GUARD: No valid session, redirecting to login")
        router.push("/login")
      }
    } else {
      setIsAuthorized(true)
    }
  }, [user, profile, pathname, router, isInitialized])

  // Si ya se resolvió rápido, mostrar contenido inmediatamente
  if (quickResolved && isAuthorized) {
    return <>{children}</>
  }

  // Si está inicializado y autorizado, mostrar contenido
  if (isInitialized && isAuthorized) {
    return <>{children}</>
  }

  // Mostrar loading solo si no se ha resuelto rápido
  if (!quickResolved && ((!isInitialized && !isAuthorized) || (isLoading && !isAuthorized))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#006BA6]" />
            <h2 className="text-xl font-semibold text-gray-800">Cargando...</h2>
            <p className="text-center text-gray-600 text-sm">Verificando acceso...</p>

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
                        setQuickResolved(true)
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
