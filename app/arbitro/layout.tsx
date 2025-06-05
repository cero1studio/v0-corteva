"use client"

import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function ArbitroLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/corteva-logo.png" alt="Corteva Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold tracking-tight">Corteva</span>
          </div>
        </div>

        {/* Botón de menú móvil */}
        <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar para desktop */}
        <aside className="w-64 border-r bg-muted/40 hidden md:block">
          <DashboardNav role="arbitro" />
        </aside>

        {/* Sidebar móvil */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
              <DashboardNav role="arbitro" onMobileMenuClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
