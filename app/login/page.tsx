"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, isLoading, error: authError, user, profile } = useAuth()

  // Si ya hay usuario logueado, redirigir al dashboard
  useEffect(() => {
    if (user && profile) {
      const getDashboardRoute = (role: string, teamId?: string | null) => {
        switch (role) {
          case "admin":
            return "/admin/dashboard"
          case "capitan":
            return teamId ? "/capitan/dashboard" : "/capitan/crear-equipo"
          case "director_tecnico":
            return "/director-tecnico/dashboard"
          case "supervisor":
            return "/supervisor/dashboard"
          case "representante":
            return "/representante/dashboard"
          case "arbitro":
            return "/arbitro/dashboard"
          default:
            return "/login"
        }
      }

      const dashboardRoute = getDashboardRoute(profile.role, profile.team_id)
      window.location.href = dashboardRoute
    }
  }, [user, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email || !password) {
      setLocalError("Por favor ingresa tu correo y contraseña")
      return
    }

    try {
      setIsSubmitting(true)
      const result = await signIn(email, password)

      if (result?.error) {
        if (result.error.includes("Invalid login")) {
          setLocalError("Correo o contraseña incorrectos")
        } else if (result.error.includes("too many requests")) {
          setLocalError("Demasiados intentos fallidos. Intenta más tarde.")
        } else {
          setLocalError("Error al iniciar sesión. Verifica tus credenciales.")
        }
        setIsSubmitting(false)
      }
    } catch (error: any) {
      setLocalError("Error al iniciar sesión. Intenta nuevamente.")
      setIsSubmitting(false)
    }
  }

  const displayError = localError || authError

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-64 h-32 relative mb-4">
            <Image
              src="/super-ganaderia-logo-black.png"
              alt="Súper Ganadería Logo"
              fill
              style={{ objectFit: "contain" }}
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.style.display = "none"
                const parent = target.parentElement
                if (parent) {
                  const fallback = document.createElement("div")
                  fallback.textContent = "SÚPER GANADERÍA"
                  fallback.className =
                    "text-2xl font-bold text-center text-[#006BA6] w-full h-full flex items-center justify-center"
                  parent.appendChild(fallback)
                }
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#006BA6]">Competencia de Ventas</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
                className="w-full"
              />
            </div>
            <div className="space-y-2 relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting || isLoading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isSubmitting || isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {displayError && <div className="text-red-500 text-sm">{displayError}</div>}
            <Button
              type="submit"
              className="w-full bg-[#006BA6] hover:bg-[#005A8C]"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <div className="w-24 h-12 relative">
            <Image
              src="/corteva-logo.png"
              alt="Corteva Logo"
              fill
              style={{ objectFit: "contain" }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.style.display = "none"
                const parent = target.parentElement
                if (parent) {
                  const fallback = document.createElement("div")
                  fallback.textContent = "CORTEVA"
                  fallback.className =
                    "text-sm font-bold text-center text-gray-600 w-full h-full flex items-center justify-center"
                  parent.appendChild(fallback)
                }
              }}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
