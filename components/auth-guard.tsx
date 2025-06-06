"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"
import { hasCachedSession, getCachedSession, getCachedProfile } from "@/lib/session-cache"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/primer-acceso", "/ranking-publico"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isInitialized, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [hasTriedCache, setHasTriedCache] = useState(false)

  // Para URLs directas: intentar usar caché inmediatamente
  useEffect(() => {
    if (!isInitialized && !hasTriedCache && pathname && pathname !== "/login") {
      const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

      if (!isPublicRoute && hasCachedSession()) {
        console.log("AUTH-GUARD: Direct URL access, trying cached session")
        const { session: cachedSession } = getCachedSession()
        const cachedProfile = getCachedProfile()

        if (cachedSession && cachedProfile) {
          console.log("AUTH-GUARD: Found valid cache for direct URL access")
          setIsAuthorized(true)
          setHasTriedCache(true)
          return
        }
      }
      setHasTriedCache(true)
    }
  }, [pathname, isInitialized, hasTriedCache])

  // Mostrar el fallback después de 3 segundos si sigue cargando
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized && !isAuthorized) {
        setShowFallback(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isInitialized, isAuthorized])

  // Timeout de seguridad más agresivo para URLs directas
  useEffect(() => {
    const securityTimeout = setTimeout(() => {
      if (!isInitialized && !isAuthorized) {
        console.error("AUTH-GUARD: Security timeout reached for direct URL, redirecting to login")
        router.push("/login")
      }
    }, 8000) // Reducido de 15 a 8 segundos para URLs directas

    return () => clearTimeout(securityTimeout)
  }, [isInitialized, isAuthorized, router])

  useEffect(() => {
    // Si aún no se ha inicializado la autenticación, no hacemos nada
    if (!isInitialized) return

    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

    if (isPublicRoute) {
      // Si es una ruta pública, permitir acceso sin importar el estado de autenticación
      setIsAuthorized(true)
    } else if (!user || !profile) {
      // Si no es una ruta pública y no hay usuario autenticado, redirigir a login
      console.log("AUTH-GUARD: No user/profile, redirecting to login")
      router.push("/login")
    } else {
      // Si hay un usuario autenticado, permitir acceso
      setIsAuthorized(true)
    }
  }, [user, profile, pathname, router, isInitialized])

  // Mientras se verifica la autorización, mostrar un loader con mensaje
  if ((!isInitialized && !isAuthorized) || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#006BA6]" />
            <h2 className="text-xl font-semibold text-gray-800">Verificando sesión...</h2>
            <p className="text-center text-gray-600 text-sm">
              {pathname && pathname !== "/login" ? "Cargando página solicitada..." : "Iniciando aplicación..."}
            </p>

            {showFallback && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm mb-3">La carga está tomando más tiempo de lo esperado.</p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => router.push("/login")}
                    className="px-4 py-2 bg-[#006BA6] text-white rounded-md hover:bg-[#005a8b] text-sm font-medium"
                  >
                    Ir al inicio de sesión
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
                  >
                    Recargar página
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Si está autorizado, mostrar los children
  return isAuthorized ? (
    <>{children}</>
  ) : (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-gray-600 mb-4">Verificando acceso...</p>
      <button onClick={() => router.push("/login")} className="text-[#006BA6] hover:underline">
        Ir al inicio de sesión
      </button>
    </div>
  )
}
