import type React from "react"
// Tipos globales para Next.js 15
export interface PageProps {
  params: Promise<Record<string, string>>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export interface LayoutProps {
  children: React.ReactNode
  params: Promise<Record<string, string>>
}

// Tipos específicos para páginas dinámicas
export interface DynamicPageProps<T = Record<string, string>> {
  params: Promise<T>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}
