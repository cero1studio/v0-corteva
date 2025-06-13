"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requireTeam?: boolean
}

export function AuthGuard({ children, allowedRoles, requireTeam = false }: AuthGuardProps) {
  const { user, profile, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showRetry, setShowRetry] = useState(false)

  // Determinar si el usuario está autorizado
  const isAuthorized = user && profile && (!allowedRoles || allowedRoles.includes(profile.role))

  // Timeout para mostrar botón de reintento si la carga toma demasiado tiempo
  useEffect(() => {
    if (isLoading && !isInitialized) {
      const timer = setTimeout(() => {
        setShowRetry(true)
      }, 15000) // 15 segundos

      return () => clearTimeout(timer)
    } else {
      setShowRetry(false)
    }
  }, [isLoading, isInitialized])

  // Manejo de redirección
  useEffect(() => {
    if (isLoading || !isInitialized) {
      return // No redirigir si aún estamos en el proceso de carga
    }

    if (!isAuthorized || !profile) {
      router.push("/login") // Redirigir a login si no está autorizado o perfil no cargado
      return
    }

    // Si requiere equipo y el usuario es capitán sin equipo
    if (requireTeam && profile.role === "capitan" && !profile.team_id) {
      router.push("/capitan/crear-equipo")
      return
    }
  }, [isLoading, isInitialized, isAuthorized, profile, router, requireTeam])

  const handleRetry = () => {
    setShowRetry(false)
    window.location.reload()
  }

  // Mostrar loading mientras se inicializa la autenticación
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div className="space-y-2">
            <p className="text-gray-600">Verificando autenticación...</p>
            {showRetry && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">La carga está tardando más de lo esperado</p>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Reintentar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Si no está autorizado, no mostrar nada (la redirección ya se maneja en useEffect)
  if (!isAuthorized || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Si requiere equipo y no lo tiene
  if (requireTeam && profile.role === "capitan" && !profile.team_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Redirigiendo a creación de equipo...</p>
        </div>
      </div>
    )
  }

  // Usuario autorizado, mostrar contenido
  return <>{children}</>
}
