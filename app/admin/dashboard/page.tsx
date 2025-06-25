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
  const [zoneStats, setZoneStats] = useState<any[]>([])
  const [productStats, setProductStats] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [dataLoaded, setDataLoaded] = useState({
    basicStats: false,
    zoneStats: false,
    productStats: false,
  })

  // --- helper to fetch dynamic ranking from the API route ---
  async function fetchRanking(zoneId?: string) {
    const url = zoneId ? `/api/ranking-list?zoneId=${zoneId}` : "/api/ranking-list"
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    // the route returns { success, data }
    if (!json.success) throw new Error("Ranking API error")
    return json.data as any[]
  }

  // Función para obtener estadísticas básicas
  const fetchBasicStats = useCallback(async () => {
    try {
      // Usar consultas más simples y secuenciales en lugar de paralelas
      const [capitanes, directores, teams, zones, products, sales] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "capitan"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "director_tecnico"),
        supabase.from("teams").select("*", { count: "exact", head: true }),
        supabase.from("zones").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("sales").select("*", { count: "exact", head: true }),
      ])

      setStats({
        totalCapitanes: capitanes.count || 0,
        totalDirectores: directores.count || 0,
        totalTeams: teams.count || 0,
        totalZones: zones.count || 0,
        totalProducts: products.count || 0,
        totalSales: sales.count || 0,
      })

      setDataLoaded((prev) => ({ ...prev, basicStats: true }))
      return true
    } catch (error: any) {
      console.error("Error al cargar estadísticas básicas:", error)
      return false
    }
  }, [])

  // Función separada para cargar estadísticas de zonas (simplificada)
  const fetchZoneStats = useCallback(async () => {
    try {
      // Solo obtener conteo básico de zonas sin cálculos complejos
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name")
      if (zonesError) throw zonesError

      // Crear estadísticas básicas sin llamar al ranking por zona
      const basicZoneStats = zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        teams: 0, // Simplificado
        total_goals: 0, // Simplificado
      }))

      setZoneStats(basicZoneStats)
      setDataLoaded((prev) => ({ ...prev, zoneStats: true }))
      return true
    } catch (error) {
      console.error("Error al cargar estadísticas de zonas:", error)
      return false
    }
  }, [])

  // Función separada para cargar estadísticas de productos
  const fetchProductStats = useCallback(async () => {
    try {
      // Consulta simplificada para productos
      const { data, error } = await supabase.from("products").select("id, name")

      if (error) throw error

      // Para cada producto, obtener ventas en consultas separadas
      const productStatsPromises = data.map(async (product) => {
        const { data: salesData } = await supabase.from("sales").select("quantity, points").eq("product_id", product.id)

        const totalSales = salesData?.reduce((sum, sale) => sum + (sale.quantity || 0), 0) || 0
        const totalPoints = salesData?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0

        return {
          id: product.id,
          name: product.name,
          sales: totalSales,
          totalPoints: totalPoints,
        }
      })

      const productStatsResults = await Promise.all(productStatsPromises)
      setProductStats(productStatsResults)
      setDataLoaded((prev) => ({ ...prev, productStats: true }))
      return true
    } catch (error) {
      console.error("Error al cargar estadísticas de productos:", error)
      return false
    }
  }, [])

  // Cargar datos de forma secuencial y con manejo de errores
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const loadData = async () => {
      if (!isMounted) return

      // 🚀 CACHE SIMPLE: Si ya tenemos datos básicos y no es un retry forzado, no recargar
      if (dataLoaded.basicStats && stats.totalTeams > 0 && retryCount === 0) {
        console.log("📦 Usando datos en cache - no recargando")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Timeout más corto
      timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          setLoading(false)
          if (!dataLoaded.basicStats) {
            setError("Timeout - intenta nuevamente")
          }
        }
      }, 10000) // Reducir a 10 segundos

      // Cargar solo estadísticas básicas primero
      const basicStatsSuccess = await fetchBasicStats()

      if (basicStatsSuccess && isMounted) {
        // Cargar el resto con delay para no sobrecargar
        setTimeout(() => {
          if (isMounted) {
            Promise.allSettled([fetchZoneStats(), fetchProductStats()])
          }
        }, 100)
      }

      if (isMounted) {
        setLoading(false)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    loadData()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [retryCount])

  const handleRetry = () => {
    setError(null)
    setRetryCount((prev) => prev + 1)
  }

  if (error && !dataLoaded.basicStats) {
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
            {loading && !dataLoaded.basicStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
            )}
            <p className="text-xs text-muted-foreground">Equipos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capitanes y Directores Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !dataLoaded.basicStats ? (
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
            {loading && !dataLoaded.basicStats ? (
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
            {loading && !dataLoaded.basicStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ventas registradas</p>
              {!loading && dataLoaded.productStats && (
                <p className="text-xs text-green-600 font-medium">
                  {Math.round((productStats.reduce((sum, product) => sum + product.totalPoints, 0) / 10) * 10) / 10}{" "}
                  kilos totales
                </p>
              )}
            </div>
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
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Concurso</CardTitle>
                <CardDescription>Goles acumulados por equipo y semana - Todos los equipos del ranking</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[500px]">
                  <AdminStatsChart />
                </div>
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
                <AdminZonesChart zonesData={zoneStats.sort((a, b) => b.total_goals - a.total_goals).slice(0, 2)} />
              </div>
            </CardContent>
          </Card>

          {/* Simplificar las cards de zonas */}
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Las estadísticas detalladas por zona están disponibles en el ranking completo.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/admin/ranking">Ver ranking por zonas</Link>
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Producto</CardTitle>
              <CardDescription>Distribución de ventas por producto</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !dataLoaded.productStats ? (
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
                        <div className="text-right">
                          <div>{product.totalPoints} puntos</div>
                          <div>{Math.round((product.totalPoints / 10) * 10) / 10} kilos</div>
                        </div>
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
