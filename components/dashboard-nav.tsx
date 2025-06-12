"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
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
  Target,
  Zap,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface NavProps {
  role: "admin" | "capitan" | "supervisor" | "director-tecnico" | "representante" | "arbitro"
  onMobileMenuClose?: () => void
}

export function DashboardNav({ role, onMobileMenuClose }: NavProps) {
  const pathname = usePathname()
  const { profile, signOut, isLoading } = useAuth()

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Función para cerrar sesión mejorada
  const handleSignOut = async () => {
    try {
      console.log("Dashboard: Iniciando cierre de sesión...")
      await signOut()
    } catch (error) {
      console.error("Dashboard: Error al cerrar sesión:", error)
      // Forzar redirección en caso de error
      window.location.href = "/login"
    }
  }

  // Función para manejar clic en enlace móvil
  const handleLinkClick = () => {
    if (onMobileMenuClose) {
      onMobileMenuClose()
    }
  }

  // Función para obtener el rol real del usuario autenticado
  const getUserRole = () => {
    if (profile?.role) {
      return profile.role
    }
    return role
  }

  // Función para obtener el label del rol
  const getRoleLabel = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "Administrador"
      case "capitan":
        return "Capitán"
      case "supervisor":
        return "Supervisor"
      case "director_tecnico":
        return "Director Técnico"
      case "representante":
        return "Representante"
      case "arbitro":
        return "Árbitro"
      default:
        return "Usuario"
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
          { href: "/admin/retos", label: "Retos", icon: Target },
          { href: "/admin/tiros-libres", label: "Tiros Libres", icon: Zap },
          { href: "/admin/configuracion", label: "Configuración", icon: Settings },
          { href: "/perfil", label: "Perfil", icon: User },
        ]
      case "capitan":
        return [
          { href: "/capitan/dashboard", label: "Dashboard", icon: Home },
          { href: "/capitan/ventas", label: "Ventas", icon: ShoppingCart },
          { href: "/capitan/clientes", label: "Clientes", icon: Users },
          { href: "/capitan/ranking", label: "Ranking", icon: Trophy },
          { href: "/perfil", label: "Perfil", icon: User },
        ]
      case "supervisor":
        return [
          { href: "/supervisor/dashboard", label: "Dashboard", icon: Home },
          { href: "/supervisor/equipos", label: "Equipos", icon: Users },
          { href: "/supervisor/reportes", label: "Reportes", icon: FileText },
          { href: "/perfil", label: "Perfil", icon: User },
        ]
      case "director-tecnico":
        return [
          { href: "/director-tecnico/dashboard", label: "Dashboard", icon: Home },
          { href: "/director-tecnico/equipos", label: "Equipos", icon: Users },
          { href: "/director-tecnico/ranking", label: "Ranking", icon: Trophy },
          { href: "/director-tecnico/reportes", label: "Reportes", icon: FileText },
          { href: "/director-tecnico/perfil", label: "Perfil", icon: User },
          { href: "/perfil", label: "Cambiar Contraseña", icon: Settings },
        ]
      case "representante":
        return [
          { href: "/representante/dashboard", label: "Dashboard", icon: Home },
          { href: "/representante/registrar-venta", label: "Registrar Venta", icon: ShoppingCart },
          { href: "/perfil", label: "Perfil", icon: User },
        ]
      case "arbitro":
        return [
          { href: "/arbitro/dashboard", label: "Dashboard", icon: Home },
          { href: "/arbitro/equipos", label: "Equipos", icon: Users },
          { href: "/arbitro/ranking", label: "Ranking", icon: Trophy },
          { href: "/arbitro/reportes", label: "Reportes", icon: FileText },
          { href: "/arbitro/perfil", label: "Perfil", icon: User },
          { href: "/perfil", label: "Cambiar Contraseña", icon: Settings },
        ]
      default:
        return []
    }
  }

  const navLinks = getNavLinks()
  const actualUserRole = getUserRole()

  return (
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
              onClick={handleLinkClick}
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
            <span className="text-xs text-muted-foreground">{getRoleLabel(actualUserRole)}</span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoading ? "Cerrando..." : "Cerrar Sesión"}</span>
        </button>
      </div>
    </div>
  )
}
