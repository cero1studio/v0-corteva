"use client"

import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"

interface DirectorTecnicoLayoutProps {
  children: React.ReactNode
}

export default function DirectorTecnicoLayout({ children }: DirectorTecnicoLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar fijo */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r">
        <DashboardNav role="director-tecnico" />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 ml-64">
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
