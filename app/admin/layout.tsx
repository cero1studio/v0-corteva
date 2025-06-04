import type React from "react"
import { BarChart3, LayoutDashboard, ListChecks, Settings, Target, Users } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { Sidebar, type SidebarNavItem } from "@/components/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: "General",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    title: "Retos",
    href: "/admin/retos",
    icon: ListChecks,
  },
  {
    title: "Tiros Libres",
    href: "/admin/tiros-libres",
    icon: Target,
  },
  {
    title: "Estadísticas",
    href: "/admin/estadisticas",
    icon: BarChart3,
  },
  {
    title: "Ajustes",
    href: "/admin/ajustes",
    icon: Settings,
  },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen antialiased">
      <Sidebar className="hidden border-r bg-gray-100 md:block">
        <MainNav className="flex flex-col gap-6" />
        <div className="mb-8 px-6">
          <p className="text-sm font-semibold">Panel de Administración</p>
        </div>
        <Sidebar items={sidebarNavItems} />
      </Sidebar>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </main>
    </div>
  )
}
