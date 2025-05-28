import type { ReactNode } from "react"
import { DashboardNav } from "@/components/dashboard-nav"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardNav role="admin" />
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 shrink-0 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Panel de Administrador</h2>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
