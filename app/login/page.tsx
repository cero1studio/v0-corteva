"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { signIn, error: authError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setIsSubmitting(true)

    if (!email || !password) {
      setLocalError("Por favor ingresa tu correo y contraseña")
      setIsSubmitting(false)
      return
    }

    try {
      // Enviar petición de login y esperar a que se complete
      const result = await signIn(email, password)

      if (result.error) {
        setLocalError(result.error)
        setIsSubmitting(false)
        return
      }

      // Si el login fue exitoso y tenemos el perfil, redirigir UNA SOLA VEZ
      if (result.profile) {
        const { role, team_id } = result.profile

        let dashboardRoute = "/login"

        switch (role) {
          case "admin":
            dashboardRoute = "/admin/dashboard"
            break
          case "capitan":
            dashboardRoute = team_id ? "/capitan/dashboard" : "/capitan/crear-equipo"
            break
          case "director_tecnico":
            dashboardRoute = "/director-tecnico/dashboard"
            break
          case "supervisor":
            dashboardRoute = "/supervisor/dashboard"
            break
          case "representante":
            dashboardRoute = "/representante/dashboard"
            break
        }

        console.log(`Redirigiendo a: ${dashboardRoute}`)
        window.location.href = dashboardRoute
      }
    } catch (error) {
      console.error("Error en login:", error)
      setLocalError("Error al iniciar sesión. Intenta nuevamente.")
      setIsSubmitting(false)
    }
  }

  // Mostrar error de autenticación o error local
  const displayError = localError || authError

  if (!mounted) {
    return null
  }

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
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
            {displayError && <div className="text-red-500 text-sm">{displayError}</div>}
            <Button type="submit" className="w-full bg-[#006BA6] hover:bg-[#005A8C]" disabled={isSubmitting}>
              {isSubmitting ? (
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
          <p className="text-sm text-gray-500 mb-4">
            ¿Primer acceso?{" "}
            <a href="/primer-acceso" className="text-[#006BA6] hover:underline">
              Configura tu contraseña
            </a>
          </p>
          <div className="w-24 h-12 relative">
            <Image src="/corteva-logo.png" alt="Corteva Logo" fill style={{ objectFit: "contain" }} />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
