"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AdminStatsChart } from "@/components/admin-stats-chart"
import { AdminZonesChart } from "@/components/admin-zones-chart"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Users,
  Building2,
  Package,
  Trophy,
  Settings,
  UserPlus,
  Download,
  AlertCircle,
  ShoppingBag,
  Award,
  MapPin,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useRouter } from "next/navigation"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCapitanes: 0,
    totalDirectores: 0,
    totalTeams: 0,
    totalZones: 0,
    totalProducts: 0,
    totalSales: 0,
  })
  const [topTeams, setTopTeams] = useState<any[]>([])
  const [zoneStats, setZoneStats] = useState<any[]>([])
  const [productStats, setProductStats] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [salesStructure, setSalesStructure] = useState<any>(null)

  useEffect(() => {
    // Verificar sesión primero
    async function checkSession() {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error al verificar sesión:", sessionError)
          router.push("/login")
          return
        }

        if (!sessionData.session) {
          console.log("No hay sesión activa")
          router.push("/login")
          return
        }

        // Verificar perfil
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionData.session.user.id)
          .single()

        if (profileError) {
          console.error("Error al obtener perfil:", profileError)
          setError("Error al verificar permisos. Por favor, inicia sesión nuevamente.")
          return
        }

        if (profile.role !== "admin") {
          console.log("Usuario no es admin:", profile.role)
          router.push(`/${profile.role}/dashboard`)
          return
        }

        // Si todo está bien, cargar datos
        fetchStructure()
      } catch (error) {
        console.error("Error al verificar autenticación:", error)
        setError("Error de conexión. Por favor, verifica tu conexión a internet.")
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  // Obtener la estructura de la tabla sales primero
  async function fetchStructure() {
    try {
      // Verificar la estructura de la tabla sales
      const { data: salesData, error: salesError } = await supabase.from("sales").select().limit(1)

      if (salesError) throw salesError

      if (salesData && salesData.length > 0) {
        setSalesStructure(salesData[0])
      }

      // Continuar con el resto de las consultas
      fetchStats()
      fetchTopTeams()
      fetchZoneStats()
      fetchProductStats()
    } catch (error: any) {
      console.error("Error al obtener estructura:", error)
      setError(`Error al cargar datos: ${error.message}`)
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      setLoading(true)

      // Obtener estadísticas de capitanes
      const { count: capitanesCount, error: capitanesError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "capitan")

      if (capitanesError) throw capitanesError

      // Obtener estadísticas de directores técnicos
      const { count: directoresCount, error: directoresError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "director_tecnico")

      if (directoresError) throw directoresError

      // Obtener estadísticas de equipos
      const { count: teamsCount, error: teamsError } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true })

      if (teamsError) throw teamsError

      // Obtener estadísticas de zonas
      const { count: zonesCount, error: zonesError } = await supabase
        .from("zones")
        .select("*", { count: "exact", head: true })

      if (zonesError) throw zonesError

      // Obtener estadísticas de productos
      const { count: productsCount, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })

      if (productsError) throw productsError

      // Obtener estadísticas de ventas
      const { count: salesCount, error: salesError } = await supabase
        .from("sales")
        .select("*", { count: "exact", head: true })

      if (salesError) throw salesError

      setStats({
        totalCapitanes: capitanesCount || 0,
        totalDirectores: directoresCount || 0,
        totalTeams: teamsCount || 0,
        totalZones: zonesCount || 0,
        totalProducts: productsCount || 0,
        totalSales: salesCount || 0,
      })
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error)
      setError(`Error al cargar estadísticas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTopTeams() {
    try {
      if (!salesStructure) {
        // Si no tenemos la estructura, no podemos continuar
        setTopTeams([])
        return
      }

      // Identificamos qué columna contiene el ID del equipo
      const teamIdColumn = salesStructure.hasOwnProperty("team_id") ? "team_id" : "id_team"

      // Obtener todas las ventas
      const { data: salesData, error: salesError } = await supabase.from("sales").select(`*, ${teamIdColumn}`)

      if (salesError) throw salesError

      if (salesData.length === 0) {
        setTopTeams([])
        return
      }

      // Obtener todos los equipos
      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("id, name, zone_id")

      if (teamsError) throw teamsError

      // Obtener todas las zonas
      const { data: zonesData, error: zonesError } = await supabase.from("zones").select("id, name")

      if (zonesError) throw zonesError

      // Crear mapa de equipos y zonas para búsqueda rápida
      const teamsMap = Object.fromEntries(teamsData.map((team) => [team.id, team]))
      const zonesMap = Object.fromEntries(zonesData.map((zone) => [zone.id, zone]))

      // Agrupar ventas por equipo
      const teamPoints: Record<string, { id: string; name: string; zone: string; points: number }> = {}

      salesData.forEach((sale) => {
        const teamId = sale[teamIdColumn]
        if (teamId && teamsMap[teamId]) {
          if (!teamPoints[teamId]) {
            const team = teamsMap[teamId]
            const zoneName = team.zone_id && zonesMap[team.zone_id] ? zonesMap[team.zone_id].name : "Sin zona"

            teamPoints[teamId] = {
              id: teamId,
              name: team.name,
              zone: zoneName,
              points: 0,
            }
          }
          teamPoints[teamId].points += sale.points || 0
        }
      })

      // Convertir a array y ordenar
      const sortedTeams = Object.values(teamPoints)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)

      setTopTeams(sortedTeams)
    } catch (error: any) {
      console.error("Error al cargar equipos destacados:", error)
      // No establecemos error global para no bloquear todo el dashboard
    }
  }

  async function fetchZoneStats() {
    try {
      if (!salesStructure) {
        // Si no tenemos la estructura, no podemos continuar
        setZoneStats([])
        return
      }

      // Identificamos qué columna contiene el ID del equipo
      const teamIdColumn = salesStructure.hasOwnProperty("team_id") ? "team_id" : "id_team"

      // Obtener zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name")

      if (zonesError) throw zonesError

      // Para cada zona, obtener equipos y ventas
      const zoneStatsData = await Promise.all(
        zones.map(async (zone) => {
          // Contar equipos en la zona
          const { count: teamCount, error: teamError } = await supabase
            .from("teams")
            .select("*", { count: "exact", head: true })
            .eq("zone_id", zone.id)

          if (teamError) throw teamError

          // Obtener ventas de equipos en la zona
          const { data: teamIds, error: teamIdsError } = await supabase
            .from("teams")
            .select("id")
            .eq("zone_id", zone.id)

          if (teamIdsError) throw teamIdsError

          let totalPoints = 0

          if (teamIds.length > 0) {
            const teamIdList = teamIds.map((t) => t.id)

            const { data: sales, error: salesError } = await supabase
              .from("sales")
              .select("points")
              .in(teamIdColumn, teamIdList)

            if (salesError) throw salesError

            totalPoints = sales.reduce((sum, sale) => sum + (sale.points || 0), 0)
          }

          return {
            id: zone.id,
            name: zone.name,
            teams: teamCount || 0,
            points: totalPoints,
          }
        }),
      )

      setZoneStats(zoneStatsData)
    } catch (error) {
      console.error("Error al cargar estadísticas de zonas:", error)
      // No establecemos error global para no bloquear todo el dashboard
    }
  }

  async function fetchProductStats() {
    try {
      // Obtener productos
      const { data: products, error: productsError } = await supabase.from("products").select("id, name, points")

      if (productsError) throw productsError

      // Para cada producto, obtener ventas
      const productStatsData = await Promise.all(
        products.map(async (product) => {
          // Contar ventas del producto
          const { count: salesCount, error: salesError } = await supabase
            .from("sales")
            .select("*", { count: "exact", head: true })
            .eq("product_id", product.id)

          if (salesError) throw salesError

          // Calcular puntos totales
          const totalPoints = (salesCount || 0) * (product.points || 0)

          return {
            id: product.id,
            name: product.name,
            sales: salesCount || 0,
            points: product.points || 0,
            totalPoints,
          }
        }),
      )

      // Ordenar por ventas
      productStatsData.sort((a, b) => b.sales - a.sales)

      setProductStats(productStatsData)
    } catch (error) {
      console.error("Error al cargar estadísticas de productos:", error)
      // No establecemos error global para no bloquear todo el dashboard
    }
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar el dashboard"
        description={error}
        actionLabel="Reintentar"
        onClick={() => window.location.reload()}
        className="flex-1 py-20"
        iconClassName="bg-red-50"
      />
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Administrador</h2>
          <p className="text-muted-foreground">
            Gestión del concurso Super Ganadería | {stats.totalTeams} Equipos activos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/usuarios/nuevo">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/configuracion">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.totalTeams}</div>}
            <p className="text-xs text-muted-foreground">Equipos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capitanes y Directores Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalCapitanes + stats.totalDirectores}</div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Capitanes: {stats.totalCapitanes}</span>
              <span>Directores Técnicos: {stats.totalDirectores}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            )}
            <p className="text-xs text-muted-foreground">Productos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.totalSales}</div>}
            <p className="text-xs text-muted-foreground">Ventas registradas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
          <TabsTrigger value="zonas">Rendimiento por Zonas</TabsTrigger>
          <TabsTrigger value="productos">Ventas por Producto</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Evolución del Concurso</CardTitle>
                <CardDescription>Goles acumulados por equipo y semana</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <AdminStatsChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Equipos Destacados</CardTitle>
                <CardDescription>Top 5 equipos con mayor rendimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </>
                  ) : topTeams.length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title="No hay equipos destacados"
                      description="Registra ventas para ver los equipos con mejor rendimiento."
                      className="py-6"
                      iconClassName="bg-amber-50"
                    />
                  ) : (
                    <>
                      {topTeams.map((team, index) => (
                        <div key={team.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <span
                                  className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-medium ${
                                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                              )}
                              <span className="font-medium">{team.name}</span>
                              <span className="text-xs text-muted-foreground">({team.zone})</span>
                            </div>
                            <span className="font-bold text-green-600">{team.points}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {!loading && (
                  <div className="mt-4 flex justify-end gap-3">
                    <Button asChild variant="default" size="sm">
                      <Link href="/admin/equipos/nuevo">Crear Equipo</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/ranking">Ver ranking completo</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="zonas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Zonas</CardTitle>
              <CardDescription>Rendimiento por zona geográfica</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <AdminZonesChart />
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            {loading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : zoneStats.length === 0 ? (
              <div className="col-span-3">
                <EmptyState
                  icon={MapPin}
                  title="No hay zonas registradas"
                  description="Crea zonas geográficas para organizar tus equipos y ver su rendimiento."
                  actionLabel="Crear Zona"
                  actionHref="/admin/zonas/nuevo"
                  className="py-10"
                />
              </div>
            ) : (
              zoneStats.map((zone) => (
                <Card key={zone.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{zone.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{zone.points}</div>
                    <p className="text-xs text-muted-foreground">{zone.teams} equipos</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Producto</CardTitle>
              <CardDescription>Distribución de ventas por producto</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : productStats.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No hay productos registrados"
                  description="Crea productos para que los equipos puedan registrar sus ventas."
                  actionLabel="Crear Producto"
                  actionHref="/admin/productos/nuevo"
                  className="py-10"
                  iconClassName="bg-green-50"
                />
              ) : (
                <div className="space-y-4">
                  {productStats.map((product) => (
                    <div key={product.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{product.name}</span>
                        <span className="font-bold text-green-600">{product.sales} unidades</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{product.sales} unidades</span>
                        <span>{product.totalPoints} goles</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex justify-center space-x-3">
                <Button asChild variant="default" size="sm" className="gap-2">
                  <Link href="/admin/productos">
                    <Package className="mr-2 h-4 w-4" />
                    Gestionar Productos
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
