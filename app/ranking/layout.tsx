import type { ReactNode } from "react"
import { DashboardNav } from "@/components/dashboard-nav"

export default function RankingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardNav role="representante" />
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 shrink-0 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Ranking Nacional</h2>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
