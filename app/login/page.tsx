"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSuccess, setLocalSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { signIn, isLoading, error: authError } = useAuth()
  const { data: session, status } = useSession()
  const router = useRouter()

  // Función para obtener la ruta del dashboard según el rol
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

  useEffect(() => {
    // Resetear estados cuando se monta el componente
    setLocalError(null)
    setIsSubmitting(false)
  }, [])

  // Redirigir si ya hay una sesión activa
  useEffect(() => {
    if (session?.user && status === "authenticated") {
      const role = session.user.role
      const teamId = session.user.team_id
      const dashboardRoute = getDashboardRoute(role, teamId)
      console.log("LOGIN: User already logged in, role:", role, "redirecting to:", dashboardRoute)
      router.push(dashboardRoute)
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email || !password) {
      setLocalError("Por favor ingresa tu correo y contraseña")
      return
    }

    try {
      setIsSubmitting(true)
      console.log("LOGIN: Attempting sign in for:", email)

      const result = await signIn(email, password)

      if (result?.error) {
        console.error("LOGIN: Sign in error:", result.error)
        // El mensaje ya viene traducido desde el hook useAuth
        setLocalError(result.error)
        setIsSubmitting(false)
      } else {
        console.log("LOGIN: Sign in successful, waiting for session...")
        setIsSubmitting(false)
        setLocalSuccess("Inicio de sesión exitoso. Redirigiendo...")
        setIsRedirecting(true)
        
        // Polling para verificar que la sesión esté disponible y redirigir
        let attempts = 0
        const maxAttempts = 20 // 4 segundos máximo
        
        const checkSessionAndRedirect = setInterval(async () => {
          attempts++
          try {
            const response = await fetch("/api/auth/session")
            const sessionData = await response.json()
            
            if (sessionData?.user?.role) {
              clearInterval(checkSessionAndRedirect)
              const role = sessionData.user.role
              const teamId = sessionData.user.team_id
              const dashboardRoute = getDashboardRoute(role, teamId)
              console.log("LOGIN: Session ready, role:", role, "redirecting to:", dashboardRoute)
              router.push(dashboardRoute)
            } else if (attempts >= maxAttempts) {
              clearInterval(checkSessionAndRedirect)
              console.log("LOGIN: Session not ready after timeout, reloading for middleware")
              // Fallback: recargar para que el middleware maneje la redirección
              window.location.href = "/login"
            }
          } catch (error) {
            console.error("LOGIN: Error checking session:", error)
            if (attempts >= maxAttempts) {
              clearInterval(checkSessionAndRedirect)
              window.location.href = "/login"
            }
          }
        }, 200)
      }
    } catch (error: any) {
      console.error("LOGIN: Error en inicio de sesión:", error)
      setLocalError("Error al iniciar sesión. Intenta nuevamente.")
      setIsSubmitting(false) // Always reset submitting state on exception
    }
  }

  // Mostrar error de autenticación o error local
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
            {localSuccess && (
              <div className="text-green-600 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {localSuccess}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-[#006BA6] hover:bg-[#005A8C]"
              disabled={isSubmitting || isLoading || isRedirecting}
            >
              {isSubmitting || isLoading || isRedirecting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRedirecting ? "Redirigiendo..." : "Iniciando sesión..."}
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
