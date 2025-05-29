"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function CapitanLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut, isLoading: authLoading } = useAuth()

  useEffect(() => {
    // Si tenemos datos del perfil, actualizar el estado
    if (profile) {
      setLoading(false)
    } else if (!authLoading) {
      // Si no hay datos y la autenticación ya terminó de cargar, mostrar error
      setLoading(false)
    }
  }, [profile, authLoading])

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleSignOut = async () => {
    try {
      console.log("Cerrando sesión desde layout de capitán...")
      // Mostrar estado de carga
      setLoading(true)
      // Llamar a la función de cierre de sesión
      await signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      // Si hay error, intentar redireccionar manualmente
      window.location.href = "/login"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  // Si el usuario no ha creado equipo y no está en la página de crear equipo, redirigir
  if (profile?.has_created_team === false && !pathname?.includes("/crear-equipo")) {
    router.push("/capitan/crear-equipo")
    return null
  }

  // Si el usuario no ha creado equipo, mostrar solo el sidebar simplificado
  if (profile?.has_created_team === false) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar fijo */}
        <div className="fixed left-0 top-0 z-30 h-screen w-64 border-r bg-white lg:block hidden">
          <div className="flex flex-col h-full">
            <div className="p-4">
              <div className="flex items-center">
                <Image
                  src="/super-ganaderia-logo.png"
                  alt="Súper Ganadería Logo"
                  width={180}
                  height={60}
                  className="h-auto"
                />
              </div>
            </div>

            <div className="flex-1"></div>

            <div className="border-t p-4">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt={profile?.full_name || "Usuario"} />
                  <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{profile?.full_name || "Usuario"}</span>
                  <span className="text-xs text-muted-foreground">Capitán</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal con margen para el sidebar */}
        <div className="flex-1 lg:ml-64 min-h-screen">{children}</div>
      </div>
    )
  }

  // Si el usuario ha creado equipo, mostrar el layout normal
  return (
    <div className="flex min-h-screen">
      <div className="fixed left-0 top-0 z-30 h-screen w-64 border-r bg-white lg:block hidden">
        <DashboardNav role="capitan" />
      </div>
      <div className="flex-1 lg:ml-64 min-h-screen">{children}</div>
    </div>
  )
}
