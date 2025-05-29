"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Package,
  Users,
  LogOut,
  Trophy,
  User,
  Settings,
  Flag,
  ShoppingCart,
  FileText,
  Menu,
  X,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface NavProps {
  role: "admin" | "capitan" | "supervisor" | "director-tecnico" | "representante"
}

export function DashboardNav({ role }: NavProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      console.log("Cerrando sesión...")
      await signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Definir los enlaces de navegación según el rol
  const getNavLinks = () => {
    switch (role) {
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: Home },
          { href: "/admin/zonas", label: "Zonas", icon: Flag },
          { href: "/admin/equipos", label: "Equipos", icon: Users },
          { href: "/admin/usuarios", label: "Usuarios", icon: User },
          { href: "/admin/productos", label: "Productos", icon: Package },
          { href: "/admin/distribuidores", label: "Distribuidores", icon: ShoppingCart },
          { href: "/admin/ventas", label: "Ventas", icon: ShoppingCart },
          { href: "/admin/clientes", label: "Clientes", icon: Users },
          { href: "/admin/ranking", label: "Ranking", icon: Trophy },
          { href: "/admin/configuracion", label: "Configuración", icon: Settings },
        ]
      case "capitan":
        return [
          { href: "/capitan/dashboard", label: "Dashboard", icon: Home },
          { href: "/capitan/ventas", label: "Ventas", icon: ShoppingCart },
          { href: "/capitan/clientes", label: "Clientes", icon: Users },
          { href: "/capitan/ranking", label: "Ranking", icon: Trophy },
        ]
      case "supervisor":
        return [
          { href: "/supervisor/dashboard", label: "Dashboard", icon: Home },
          { href: "/supervisor/equipos", label: "Equipos", icon: Users },
          { href: "/supervisor/reportes", label: "Reportes", icon: FileText },
        ]
      case "director-tecnico":
        return [
          { href: "/director-tecnico/dashboard", label: "Dashboard", icon: Home },
          { href: "/director-tecnico/equipos", label: "Equipos", icon: Users },
          { href: "/director-tecnico/ranking", label: "Ranking", icon: Trophy },
          { href: "/director-tecnico/reportes", label: "Reportes", icon: FileText },
          { href: "/director-tecnico/perfil", label: "Perfil", icon: User },
        ]
      case "representante":
        return [
          { href: "/representante/dashboard", label: "Dashboard", icon: Home },
          { href: "/representante/registrar-venta", label: "Registrar Venta", icon: ShoppingCart },
        ]
      default:
        return []
    }
  }

  const navLinks = getNavLinks()

  return (
    <>
      {/* Botón de menú móvil */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar para desktop */}
      <div className="hidden lg:flex flex-col h-full">
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

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-corteva-50 text-corteva-900"
                    : "text-muted-foreground hover:bg-corteva-50 hover:text-corteva-900",
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg" alt={profile?.full_name || "Usuario"} />
              <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{profile?.full_name || "Usuario"}</span>
              <span className="text-xs text-muted-foreground">
                {role === "admin"
                  ? "Administrador"
                  : role === "capitan"
                    ? "Capitán"
                    : role === "supervisor"
                      ? "Supervisor"
                      : role === "director-tecnico"
                        ? "Director Técnico"
                        : "Representante"}
              </span>
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

      {/* Sidebar para móvil */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
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

              <ScrollArea className="flex-1 px-3">
                <div className="space-y-1 py-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === link.href
                          ? "bg-corteva-50 text-corteva-900"
                          : "text-muted-foreground hover:bg-corteva-50 hover:text-corteva-900",
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt={profile?.full_name || "Usuario"} />
                    <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile?.full_name || "Usuario"}</span>
                    <span className="text-xs text-muted-foreground">
                      {role === "admin"
                        ? "Administrador"
                        : role === "capitan"
                          ? "Capitán"
                          : role === "supervisor"
                            ? "Supervisor"
                            : role === "director-tecnico"
                              ? "Director Técnico"
                              : "Representante"}
                    </span>
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
        </div>
      )}
    </>
  )
}
