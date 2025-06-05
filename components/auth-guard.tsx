"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/primer-acceso", "/ranking-publico"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  // Mostrar el fallback después de 3 segundos si sigue cargando
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setShowFallback(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isInitialized])

  // Timeout de seguridad - si después de 15 segundos sigue sin inicializar, redirigir a login
  useEffect(() => {
    const securityTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.error("AUTH: Security timeout reached, redirecting to login")
        router.push("/login")
      }
    }, 15000)

    return () => clearTimeout(securityTimeout)
  }, [isInitialized, router])

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
      console.log("AUTH-GUARD: No user, redirecting to login")
      router.push("/login")
    } else {
      // Si hay un usuario autenticado, permitir acceso
      setIsAuthorized(true)
    }
  }, [user, pathname, router, isInitialized])

  // Mientras se verifica la autorización, mostrar un loader con mensaje
  if (!isInitialized || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#006BA6] mb-4" />
        <p className="text-gray-600">
          {showFallback ? "Verificando sesión... Esto está tomando más tiempo de lo esperado." : "Cargando..."}
        </p>
        {showFallback && (
          <button onClick={() => router.push("/login")} className="mt-4 text-[#006BA6] hover:underline">
            Ir al inicio de sesión
          </button>
        )}
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
