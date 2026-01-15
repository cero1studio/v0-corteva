"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/primer-acceso", "/ranking-publico"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route))

  // Para rutas públicas, mostrar contenido inmediatamente
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Para rutas privadas, el middleware ya maneja la autenticación
  // Solo mostramos el contenido directamente
  return <>{children}</>
}

// Componente de loading simplificado (por si se necesita en el futuro)
export function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 text-lg font-medium">Cargando...</p>
    </div>
  )
}

// Componente de error simplificado
export function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h2>
        <p className="text-gray-600 mb-4">No se pudo cargar la sesión.</p>
        <a href="/login" className="text-blue-600 hover:underline">
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  )
}

// Nota: El middleware de NextAuth ahora maneja:
// - Verificación de sesión
// - Redirección a /login si no hay sesión
// - Redirección basada en roles
// Por lo tanto, este componente se simplifica considerablemente
