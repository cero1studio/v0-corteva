import { LayoutDashboard, Settings, ListChecks, ShieldAlert, Target } from "lucide-react"

import type { MainNavItem, SidebarNavItem } from "@/types"

interface DashboardConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "Support",
      href: "/support",
      disabled: true,
    },
  ],
  sidebarNav: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          current: true,
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          title: "Usuarios",
          href: "/admin/usuarios",
          icon: Settings,
          current: false,
        },
        {
          title: "Retos",
          href: "/admin/retos",
          icon: ListChecks,
          current: false,
        },
        {
          title: "Tiros Libres",
          href: "/admin/tiros-libres",
          icon: Target,
          current: false,
        },
        {
          title: "Reportes",
          href: "/admin/reportes",
          icon: ShieldAlert,
          current: false,
        },
      ],
      roles: ["admin"],
    },
  ],
}
