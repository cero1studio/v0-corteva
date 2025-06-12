"use client"

import { useEffect, useState, useCallback } from "react"
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
  RefreshCw,
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
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Función simple para obtener estadísticas básicas
  const fetchBasicStats = useCallback(async () => {
    try {
      setLoading(true)

      // Usar consultas simples y separadas en lugar de Promise.all
      const capitanesResult = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "capitan")

      const directoresResult = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "director_tecnico")

      const teamsResult = await supabase.from("teams").select("*", { count: "exact", head: true })

      const zonesResult = await supabase.from("zones").select("*", { count: "exact", head: true })

      const productsResult = await supabase.from("products").select("*", { count: "exact", head: true })

      const salesResult = await supabase.from("sales").select("*", { count: "exact", head: true })

      setStats({
        totalCapitanes: capitanesResult.count || 0,
        totalDirectores: directoresResult.count || 0,
        totalTeams: teamsResult.count || 0,
        totalZones: zonesResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalSales: salesResult.count || 0,
      })

      setLoading(false)
    } catch (error: any) {
      console.error("Error al cargar estadísticas básicas:", error)
      setError("Error al cargar estadísticas. Por favor, intenta nuevamente.")
      setLoading(false)
    }
  }, [])

  // Usar useEffect con dependencia en retryCount para permitir reintentos
  useEffect(() => {
    // Establecer un timeout para evitar carga infinita
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setError("La carga está tardando demasiado. Por favor, intenta nuevamente.")
      }
    }, 10000) // 10 segundos máximo

    fetchBasicStats()

    return () => {
      clearTimeout(timeout)
    }
  }, [fetchBasicStats, retryCount])

  const handleRetry = () => {
    setError(null)
    setRetryCount((prev) => prev + 1)
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar el dashboard"
        description={error}
        actionLabel="Reintentar"
        onClick={handleRetry}
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
          <div className="text-muted-foreground">
            Gestión del concurso Super Ganadería | {stats.totalTeams} Equipos activos
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRetry} variant="outline" size="icon" title="Actualizar datos">
            <RefreshCw className="h-4 w-4" />
          </Button>
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
                <div className="h-[400px]">
                  <AdminStatsChart />
                </div>
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
                            <span className="font-bold text-green-600">{team.goals}</span>
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
                {/* Pasar las top 2 zonas ordenadas por goles */}
                <AdminZonesChart zonesData={zoneStats.sort((a, b) => b.total_goals - a.total_goals).slice(0, 2)} />
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
                    <div className="text-2xl font-bold text-green-600">{zone.total_goals}</div>
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
