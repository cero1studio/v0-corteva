import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserProfile } from "@/components/user-profile"

export default function DirectorTecnicoLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    {
      title: "Dashboard",
      href: "/director-tecnico/dashboard",
      icon: "layout-dashboard",
    },
    {
      title: "Equipos de mi Zona",
      href: "/director-tecnico/equipos",
      icon: "users",
    },
    {
      title: "Reportes",
      href: "/director-tecnico/reportes",
      icon: "bar-chart",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/corteva-logo.png" alt="Corteva Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold tracking-tight">Corteva</span>
          </div>
        </div>
        <UserProfile />
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-muted/40">
          <DashboardNav items={navItems} />
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
