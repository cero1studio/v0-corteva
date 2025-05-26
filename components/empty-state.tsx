"use client"

import type React from "react"
import { type LucideIcon, UsersIcon, Package, User, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  title: string
  description: string
  icon?: string
  children?: React.ReactNode
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  title,
  description,
  icon = "users",
  children,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  // Mapeo de iconos con nombre explícito para Users
  const iconMap: Record<string, LucideIcon> = {
    users: UsersIcon,
    package: Package,
    user: User,
    chart: BarChart3,
    settings: Settings,
  }

  const IconComponent = iconMap[icon] || UsersIcon

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg border bg-white">
      <div className="rounded-full bg-corteva-50 p-4 mb-4">
        <IconComponent className="h-8 w-8 text-corteva-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>

      {/* Botón de acción */}
      {actionLabel && actionHref && (
        <Button asChild className="bg-corteva-500 hover:bg-corteva-600">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}

      {/* Botón de acción con función */}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction} className="bg-corteva-500 hover:bg-corteva-600">
          {actionLabel}
        </Button>
      )}

      {/* Children personalizados */}
      {children}
    </div>
  )
}
