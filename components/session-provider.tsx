"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type React from "react"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  try {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
  } catch (error) {
    console.error("Error en SessionProvider:", error)
    // Fallback: renderizar children sin SessionProvider si hay error
    return <>{children}</>
  }
}
