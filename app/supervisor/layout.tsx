"use client"

import { ProtectedLayout } from "@/components/ProtectedLayout"
import { DashboardNav } from "@/components/dashboard-nav"
import type { ReactNode } from "react"

export default function SupervisorLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout allowedRoles={["supervisor"]}>
      <div className="flex h-screen overflow-hidden">
        <DashboardNav role="supervisor" />
        <main className="flex-1 overflow-auto">
          <header className="flex h-16 shrink-0 items-center border-b px-6">
            <h2 className="text-lg font-semibold">Panel de Supervisor</h2>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </ProtectedLayout>
  )
}
