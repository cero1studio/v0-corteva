"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Target, TrendingUp } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      switch (user.role) {
        case "admin":
          router.push("/admin/dashboard")
          break
        case "capitan":
          router.push("/capitan/dashboard")
          break
        case "director_tecnico":
          router.push("/director-tecnico/dashboard")
          break
        case "supervisor":
          router.push("/supervisor/dashboard")
          break
        case "representante":
          router.push("/representante/dashboard")
          break
        default:
          router.push("/login")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                src="/super-ganaderia-logo.png"
                alt="Super Ganadería"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <Button onClick={() => router.push("/login")}>Iniciar Sesión</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">Super Ganadería</h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Plataforma de competencia de ventas para equipos comerciales
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Button size="lg" onClick={() => router.push("/ranking-publico")} className="w-full sm:w-auto">
              Ver Ranking Público
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Competencia</h3>
                <p className="mt-2 text-sm text-gray-500">Sistema de ranking y competencia entre equipos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Equipos</h3>
                <p className="mt-2 text-sm text-gray-500">Gestión de equipos y miembros</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Objetivos</h3>
                <p className="mt-2 text-sm text-gray-500">Seguimiento de metas y objetivos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Reportes</h3>
                <p className="mt-2 text-sm text-gray-500">Analytics y reportes detallados</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
