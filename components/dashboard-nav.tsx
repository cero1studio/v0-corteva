import { User } from "lucide-react"

import { BarChart, Building2, Calendar, Home, ListChecks, Settings, User2 } from "lucide-react"

import type { MainNavItem, SidebarNavItem } from "@/types"

interface DashboardConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Empresas",
      href: "/dashboard/companies",
    },
  ],
  sidebarNav: [
    {
      title: "General",
      items: [
        {
          title: "Inicio",
          href: "/dashboard",
          icon: Home,
        },
        {
          title: "Perfil",
          href: "/perfil",
          icon: User,
        },
      ],
    },
    {
      title: "Administración",
      items: [
        {
          title: "Empresas",
          href: "/dashboard/companies",
          icon: Building2,
        },
        {
          title: "Usuarios",
          href: "/dashboard/users",
          icon: User2,
        },
        {
          title: "Planes",
          href: "/dashboard/plans",
          icon: ListChecks,
        },
        {
          title: "Calendario",
          href: "/dashboard/calendar",
          icon: Calendar,
        },
        {
          title: "Estadísticas",
          href: "/dashboard/analytics",
          icon: BarChart,
        },
        {
          title: "Ajustes",
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ],
}
