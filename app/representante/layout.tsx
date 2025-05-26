import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { redirect } from "next/navigation"

export default function RepresentanteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redireccionar a la nueva ruta de capitán
  redirect("/capitan/dashboard")

  return (
    <div className="flex min-h-screen">
      <DashboardNav role="representante" />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
