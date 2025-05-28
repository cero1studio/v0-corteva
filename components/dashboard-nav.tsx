"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { BarChart3, Building, Home, LogOut, Package, Settings, Trophy, User, UsersIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"

interface NavProps {
  role: "capitan" | "admin" | "representante" | "director_tecnico"
  children?: React.ReactNode
}

export function DashboardNav({ role, children }: NavProps) {
  const pathname = usePathname()
  const { user, profile, signOut, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Convertir "representante" a "capitan" para mantener compatibilidad
  const normalizedRole = role === "representante" ? "capitan" : role

  useEffect(() => {
    // Si tenemos datos del usuario en el contexto de autenticación, actualizar el estado
    if (user && profile) {
      setIsLoading(false)
    } else if (!authLoading) {
      // Si no hay datos y la autenticación ya terminó de cargar, mostrar error
      setIsLoading(false)
    }
  }, [user, profile, authLoading])

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      console.log("Cerrando sesión desde DashboardNav...")
      // Mostrar estado de carga
      setIsLoading(true)
      // Llamar a la función de cierre de sesión
      await signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      setLoadError("Error al cerrar sesión")
      // Si hay error, intentar redireccionar manualmente
      window.location.href = "/login"
    }
  }

  // Navigation items based on role
  const navItems = {
    capitan: [
      {
        title: "Dashboard",
        href: "/capitan/dashboard",
        icon: Home,
      },
      {
        title: "Registrar Venta",
        href: "/capitan/registrar-venta",
        icon: Package,
      },
      {
        title: "Registrar Cliente",
        href: "/capitan/registrar-cliente",
        icon: User,
      },
      {
        title: "Ranking",
        href: "/capitan/ranking",
        icon: Trophy,
      },
    ],
    admin: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: Home,
      },
      {
        title: "Usuarios",
        href: "/admin/usuarios",
        icon: User,
      },
      {
        title: "Equipos",
        href: "/admin/equipos",
        icon: UsersIcon,
      },
      {
        title: "Distribuidores",
        href: "/admin/distribuidores",
        icon: Building,
      },
      {
        title: "Zonas",
        href: "/admin/zonas",
        icon: BarChart3,
      },
      {
        title: "Productos",
        href: "/admin/productos",
        icon: Package,
      },
      {
        title: "Ranking",
        href: "/admin/ranking",
        icon: Trophy,
      },
      {
        title: "Configuración",
        href: "/admin/configuracion",
        icon: Settings,
      },
    ],
    director_tecnico: [
      {
        title: "Dashboard",
        href: "/director-tecnico/dashboard",
        icon: Home,
      },
      {
        title: "Equipos",
        href: "/director-tecnico/equipos",
        icon: UsersIcon,
      },
      {
        title: "Reportes",
        href: "/director-tecnico/reportes",
        icon: BarChart3,
      },
      {
        title: "Ranking",
        href: "/director-tecnico/ranking",
        icon: Trophy,
      },
    ],
    // Mantener representante como copia de capitan para compatibilidad
    representante: [
      {
        title: "Dashboard",
        href: "/representante/dashboard",
        icon: Home,
      },
      {
        title: "Registrar Venta",
        href: "/representante/registrar-venta",
        icon: Package,
      },
      {
        title: "Registrar Cliente",
        href: "/representante/registrar-cliente",
        icon: User,
      },
      {
        title: "Ranking",
        href: "/ranking",
        icon: Trophy,
      },
    ],
  }

  const items = navItems[normalizedRole] || []

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Si hay un error de carga, mostrar un mensaje de error
  if (loadError) {
    return (
      <div className="flex h-screen flex-col border-r bg-white w-64">
        <div className="p-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/super-ganaderia-logo.png"
              alt="Súper Ganadería Logo"
              width={180}
              height={60}
              className="h-auto"
            />
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-500 mb-4">Error de conexión</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col border-r bg-white w-64">
      <div className="p-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/super-ganaderia-logo.png"
            alt="Súper Ganadería Logo"
            width={180}
            height={60}
            className="h-auto"
          />
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href ? "bg-corteva-50 text-corteva-500" : "text-gray-700 hover:bg-corteva-100",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-md border p-3">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </>
          ) : (
            <>
              <Avatar>
                <AvatarImage src="/placeholder.svg" alt={profile?.full_name || "Usuario"} />
                <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile?.full_name || "Usuario"}</span>
                <span className="text-xs text-muted-foreground">
                  {profile?.role === "admin"
                    ? "Administrador"
                    : profile?.role === "capitan" && profile?.team_name
                      ? profile.team_name
                      : profile?.role === "director_tecnico"
                        ? "Director Técnico"
                        : profile?.role === "capitan"
                          ? "Capitán"
                          : ""}
                </span>
              </div>
            </>
          )}
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
  )
}
