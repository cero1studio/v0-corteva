"use client"

import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function ArbitroLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Botón de menú móvil */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar para desktop */}
      <div className="fixed left-0 top-0 z-30 h-screen w-64 border-r bg-white lg:block hidden">
        <DashboardNav role="arbitro" />
      </div>

      {/* Sidebar móvil */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <DashboardNav role="arbitro" onMobileMenuClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-64">
        <header className="flex h-16 shrink-0 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Panel de Árbitro</h2>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
