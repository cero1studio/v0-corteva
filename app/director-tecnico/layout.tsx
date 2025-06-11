"use client" // Mantener 'use client' si el layout usa hooks o componentes de cliente como DashboardNav o UserProfile

import type React from "react"
import { Suspense } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserProfile } from "@/components/user-profile"
import { AuthGuard } from "@/components/auth-guard"
import { Loader2 } from "lucide-react" // Importa el icono de carga

export default function DirectorTecnicoLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    {
      title: "Dashboard",
      href: "/director-tecnico/dashboard",
      icon: "layoutDashboard",
    },
    {
      title: "Equipos",
      href: "/director-tecnico/equipos",
      icon: "users",
    },
    {
      title: "Ranking",
      href: "/director-tecnico/ranking",
      icon: "trophy",
    },
    {
      title: "Reportes",
      href: "/director-tecnico/reportes",
      icon: "barChart",
    },
    {
      title: "Perfil",
      href: "/perfil",
      icon: "user",
    },
  ]

  return (
    <AuthGuard allowedRoles={["Director Tecnico"]}>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 py-4 lg:gap-6">
            <img src="/super-ganaderia-logo.png" alt="Super Ganadería Logo" className="h-16 w-auto" />
          </nav>
          <div className="flex-1 overflow-auto py-2">
            <DashboardNav items={navItems} />
          </div>
          <div className="mt-auto p-4">
            <UserProfile />
          </div>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <h1 className="text-2xl font-semibold">Panel de Director Técnico</h1>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {/* Suspense boundary para el contenido de la página */}
            <Suspense
              fallback={
                <div className="flex justify-center items-center h-[calc(100vh-100px)]">
                  <Loader2 className="h-12 w-12 animate-spin text-corteva-600" />
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
