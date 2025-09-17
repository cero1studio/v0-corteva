"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"

export default function CapitanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const { user, signOut, isLoading: authLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (user) {
      setLoading(false)
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  // Function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleSignOut = async () => {
    try {
      console.log("Cerrando sesión desde layout de capitán...")
      setLoading(true)
      await signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      window.location.href = "/login"
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  if (user?.role === "capitan" && user?.team_id === null && !pathname?.includes("/crear-equipo")) {
    router.push("/capitan/crear-equipo")
    return null
  }

  if (!user) {
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

        {/* Sidebar fijo para desktop */}
        <div className="fixed left-0 top-0 z-30 h-screen w-64 border-r bg-white lg:block hidden">
          <div className="flex flex-col h-full">
            <div className="p-4">
              <div className="flex items-center">
                <Image
                  src="/super-ganaderia-logo.png"
                  alt="Súper Ganadería Logo"
                  width={180}
                  height={60}
                  className="h-auto"
                />
              </div>
            </div>

            <div className="flex-1"></div>

            <div className="border-t p-4">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt={user?.full_name || "Usuario"} />
                  <AvatarFallback>{user?.full_name ? getInitials(user.full_name) : "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.full_name || "Usuario"}</span>
                  <span className="text-xs text-muted-foreground">Capitán</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar móvil */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
              <div className="flex flex-col h-full">
                <div className="p-4">
                  <div className="flex items-center">
                    <Image
                      src="/super-ganaderia-logo.png"
                      alt="Súper Ganadería Logo"
                      width={180}
                      height={60}
                      className="h-auto"
                    />
                  </div>
                </div>

                <div className="flex-1"></div>

                <div className="border-t p-4">
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg" alt={user?.full_name || "Usuario"} />
                      <AvatarFallback>{user?.full_name ? getInitials(user.full_name) : "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.full_name || "Usuario"}</span>
                      <span className="text-xs text-muted-foreground">Capitán</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal con margen para el sidebar */}
        <div className="flex-1 lg:ml-64 min-h-screen">{children}</div>
      </div>
    )
  }

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
        <DashboardNav role="capitan" />
      </div>

      {/* Sidebar móvil */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <DashboardNav role="capitan" />
          </div>
        </div>
      )}

      <div className="flex-1 lg:ml-64 min-h-screen">{children}</div>
    </div>
  )
}
