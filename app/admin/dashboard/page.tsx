"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminStatsChart } from "@/components/admin-stats-chart"
import { AdminZonesChart } from "@/components/admin-zones-chart"
import { AdminRankingChart } from "@/components/admin-ranking-chart"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [zonesData, setZonesData] = useState<any[]>([])
  const [teamsData, setTeamsData] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Cargar zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("*").order("name")

      if (zonesError) throw zonesError

      // Cargar equipos con sus zonas
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          zones:zone_id(*)
        `)
        .order("name")

      if (teamsError) throw teamsError

      // Cargar ventas
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          products(id, name),
          profiles:representative_id(
            id, 
            full_name, 
            team_id,
            teams:team_id(
              id, 
              name,
              zone_id,
              zones:zone_id(id, name)
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (salesError) throw salesError

      // Procesar datos para las zonas
      const zonesWithStats = zones.map((zone) => {
        // Contar equipos por zona
        const teamsInZone = teams.filter((team) => team.zone_id === zone.id)

        // Calcular goles por zona (en lugar de contar equipos)
        const goalsInZone = calculateGoalsByZone(zone.id, teams, sales)

        return {
          ...zone,
          teams_count: teamsInZone.length,
          goals_count: goalsInZone,
        }
      })

      setZonesData(zonesWithStats)
      setTeamsData(teams)
      setSalesData(sales)
    } catch (error: any) {
      console.error("Error al cargar datos del dashboard:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para calcular goles por zona
  function calculateGoalsByZone(zoneId: string, teams: any[], sales: any[]) {
    // Obtener equipos de la zona
    const teamsInZone = teams.filter((team) => team.zone_id === zoneId)
    const teamIds = teamsInZone.map((team) => team.id)

    // Filtrar ventas de equipos en la zona
    const zoneSales = sales.filter(
      (sale) => sale.profiles?.teams?.zone_id === zoneId || teamIds.includes(sale.profiles?.team_id),
    )

    // Calcular puntos totales
    const totalPoints = zoneSales.reduce((sum, sale) => sum + (sale.points || 0), 0)

    // Convertir puntos a goles (100 puntos = 1 gol)
    const goals = Math.floor(totalPoints / 100)

    return goals
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Resumen general del rendimiento de la plataforma</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {zonesData.map((zone) => (
          <Card key={zone.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg uppercase">{zone.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{zone.goals_count || 0}</div>
              <p className="text-sm text-muted-foreground">
                {zone.goals_count === 1 ? "1 gol" : `${zone.goals_count} goles`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
          <TabsTrigger value="zones">Rendimiento por Zonas</TabsTrigger>
          <TabsTrigger value="products">Ventas por Producto</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolución del Concurso</CardTitle>
              <CardDescription>Goles acumulados por equipo y semana</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <AdminStatsChart data={salesData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Zonas</CardTitle>
              <CardDescription>Rendimiento por zona geográfica</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <AdminZonesChart data={zonesData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Producto</CardTitle>
              <CardDescription>Distribución de ventas por producto</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <AdminRankingChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
