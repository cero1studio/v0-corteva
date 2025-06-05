"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, TrendingUp, Award, Target } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ProtectedLayout } from "@/components/ProtectedLayout"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

export default function ArbitroDashboard() {
  const { user } = useAuth()

  const [retoActual, setRetoActual] = useState<string>("")
  const [retoActivo, setRetoActivo] = useState(false)

  useEffect(() => {
    loadSystemConfig()
  }, [])

  async function loadSystemConfig() {
    try {
      // Cargar reto actual
      const { data: retoData, error: retoError } = await supabase
        .from("system_config")
        .select("*")
        .eq("key", "reto_actual")
        .single()

      if (!retoError && retoData && retoData.value) {
        setRetoActual(retoData.value)
      }

      // Cargar estado del reto
      const { data: activoData, error: activoError } = await supabase
        .from("system_config")
        .select("*")
        .eq("key", "reto_activo")
        .single()

      if (!activoError && activoData) {
        setRetoActivo(activoData.value === "true" || activoData.value === true)
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  return (
    <ProtectedLayout allowedRoles={["arbitro"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard del Árbitro</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.full_name}. Supervisa el rendimiento de los equipos y la competencia.
          </p>
        </div>

        {/* Tiro libre sin arquero - Solo mostrar si está activo */}
        {retoActivo && retoActual && (
          <Card className="border-2 border-corteva-200 bg-gradient-to-r from-corteva-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full p-3 bg-corteva-500 text-white">
                  <Target className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-corteva-900 mb-2 text-lg">⚽ Tiro libre sin arquero</h3>
                  <p className="text-corteva-700 leading-relaxed">{retoActual}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipos Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+15% desde la semana pasada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,231</div>
              <p className="text-xs text-muted-foreground">+8% desde la semana pasada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medallas Otorgadas</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Equipos Destacados</CardTitle>
              <CardDescription>Los equipos con mejor rendimiento esta semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Equipo Alpha</span>
                </div>
                <Badge variant="secondary">1,250 pts</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="font-medium">Equipo Beta</span>
                </div>
                <Badge variant="secondary">1,180 pts</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="font-medium">Equipo Gamma</span>
                </div>
                <Badge variant="secondary">1,120 pts</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones en la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Equipo Alpha registró una venta de 50 unidades</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Nuevo cliente registrado por Equipo Beta</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Medalla de oro otorgada a Equipo Gamma</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
