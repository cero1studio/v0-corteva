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
  Bug,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useRouter } from "next/navigation"
import { useDiagnostics } from "@/lib/diagnostics"
import { usePersistentDashboardCache } from "@/lib/dashboard-cache"

export default function AdminDashboardPage() {
  const router = useRouter()
  const diagnostics = useDiagnostics("AdminDashboard")
  const cache = usePersistentDashboardCache()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCapitanes: 0,
    totalDirectores: 0,
    totalTeams: 0,
    totalZones: 0,
    totalClients: 0,
    totalSales: 0,
    totalSalesPoints: 0,
    totalFreeKicks: 0,
    totalFreeKickPoints: 0,
    totalClientPoints: 0,
  })
  const [zoneStats, setZoneStats] = useState<any[]>([])
  const [productStats, setProductStats] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Inicializar desde cache persistente
  useEffect(() => {
    diagnostics.log("INIT", "Checking persistent cache")

    // Verificar cache persistente al montar
    if (cache.hasStats()) {
      const cachedStats = cache.getStats()
      diagnostics.log("INIT", "Found cached stats", cachedStats)
      setStats(cachedStats)
      setLoading(false)
    }

    if (cache.hasZoneStats()) {
      const cachedZoneStats = cache.getZoneStats()
      diagnostics.log("INIT", "Found cached zone stats", { count: cachedZoneStats.length })
      setZoneStats(cachedZoneStats)
    }

    if (cache.hasProductStats()) {
      const cachedProductStats = cache.getProductStats()
      diagnostics.log("INIT", "Found cached product stats", { count: cachedProductStats.length })
      setProductStats(cachedProductStats)
    }
  }, [])

  // Trackear estados en diagnostics
  useEffect(() => {
    diagnostics.trackState({
      loading,
      error,
      retryCount,
      hasStatsCache: cache.hasStats(),
      hasZoneCache: cache.hasZoneStats(),
      hasProductCache: cache.hasProductStats(),
      statsCount: Object.keys(stats).length,
    })
  }, [loading, error, retryCount, stats])

  // Función para obtener estadísticas básicas
  const fetchBasicStats = useCallback(
    async (signal?: AbortSignal) => {
      diagnostics.log("fetchBasicStats", "Starting", { hasCache: cache.hasStats() })

      // Verificar cache persistente primero
      if (cache.hasStats()) {
        diagnostics.log("fetchBasicStats", "Using persistent cache")
        const cachedStats = cache.getStats()
        setStats(cachedStats)
        return true
      }

      try {
        const promise = Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "capitan")
            .abortSignal(signal),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "director_tecnico")
            .abortSignal(signal),
          supabase.from("teams").select("*", { count: "exact", head: true }).abortSignal(signal),
          supabase.from("zones").select("*", { count: "exact", head: true }).abortSignal(signal),
          supabase.from("competitor_clients").select("points").abortSignal(signal),
          supabase.from("sales").select("points").abortSignal(signal),
          supabase.from("free_kick_goals").select("points").abortSignal(signal),
        ])

        const [capitanes, directores, teams, zones, clients, sales, freeKicks] = await diagnostics.trackPromise(
          "basicStats",
          promise,
        )

        if (signal?.aborted) {
          diagnostics.log("fetchBasicStats", "Aborted by signal")
          return false
        }

        const totalSalesPoints = sales.data?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0
        const totalFreeKickPoints = freeKicks.data?.reduce((sum, fk) => sum + (fk.points || 0), 0) || 0
        const totalClientPoints = clients.data?.reduce((sum, client) => sum + (client.points || 0), 0) || 0

        const newStats = {
          totalCapitanes: capitanes.count || 0,
          totalDirectores: directores.count || 0,
          totalTeams: teams.count || 0,
          totalZones: zones.count || 0,
          totalClients: clients.data?.length || 0,
          totalSales: sales.data?.length || 0,
          totalSalesPoints: totalSalesPoints,
          totalFreeKicks: freeKicks.data?.length || 0,
          totalFreeKickPoints: totalFreeKickPoints,
          totalClientPoints: totalClientPoints,
        }

        diagnostics.log("fetchBasicStats", "Success", newStats)

        setStats(newStats)
        cache.setStats(newStats) // Guardar en cache persistente
        return true
      } catch (error: any) {
        if (!signal?.aborted) {
          diagnostics.log("fetchBasicStats", "Error", { error: error.message })
          console.error("Error al cargar estadísticas básicas:", error)
        }
        return false
      }
    },
    [cache, diagnostics],
  )

  // Función separada para cargar estadísticas de zonas
  const fetchZoneStats = useCallback(
    async (signal?: AbortSignal) => {
      diagnostics.log("fetchZoneStats", "Starting", { hasCache: cache.hasZoneStats() })

      if (cache.hasZoneStats()) {
        diagnostics.log("fetchZoneStats", "Using persistent cache")
        const cachedZoneStats = cache.getZoneStats()
        setZoneStats(cachedZoneStats)
        return true
      }

      try {
        const promise = supabase.from("zones").select("id, name").abortSignal(signal)
        const { data: zones, error: zonesError } = await diagnostics.trackPromise("zoneStats", promise)

        if (zonesError) throw zonesError
        if (signal?.aborted) {
          diagnostics.log("fetchZoneStats", "Aborted by signal")
          return false
        }

        const basicZoneStats = zones.map((zone) => ({
          id: zone.id,
          name: zone.name,
          teams: 0,
          total_goals: 0,
        }))

        diagnostics.log("fetchZoneStats", "Success", { count: basicZoneStats.length })

        setZoneStats(basicZoneStats)
        cache.setZoneStats(basicZoneStats) // Guardar en cache persistente
        return true
      } catch (error: any) {
        if (!signal?.aborted) {
          diagnostics.log("fetchZoneStats", "Error", { error: error.message })
          console.error("Error al cargar estadísticas de zonas:", error)
        }
        return false
      }
    },
    [cache, diagnostics],
  )

  // Función separada para cargar estadísticas de productos
  const fetchProductStats = useCallback(
    async (signal?: AbortSignal) => {
      diagnostics.log("fetchProductStats", "Starting", { hasCache: cache.hasProductStats() })

      if (cache.hasProductStats()) {
        diagnostics.log("fetchProductStats", "Using persistent cache")
        const cachedProductStats = cache.getProductStats()
        setProductStats(cachedProductStats)
        return true
      }

      try {
        const promise = supabase.from("products").select("id, name").abortSignal(signal)
        const { data, error } = await diagnostics.trackPromise("productsList", promise)

        if (error) throw error
        if (signal?.aborted) {
          diagnostics.log("fetchProductStats", "Aborted by signal")
          return false
        }

        const productStatsPromises = data.map(async (product) => {
          const salesPromise = supabase
            .from("sales")
            .select("quantity, points")
            .eq("product_id", product.id)
            .abortSignal(signal)

          const { data: salesData } = await diagnostics.trackPromise(`productSales-${product.id}`, salesPromise)

          if (signal?.aborted) return null

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

        if (signal?.aborted) {
          diagnostics.log("fetchProductStats", "Aborted by signal")
          return false
        }

        const filteredResults = productStatsResults.filter(Boolean)
        diagnostics.log("fetchProductStats", "Success", { count: filteredResults.length })

        setProductStats(filteredResults)
        cache.setProductStats(filteredResults) // Guardar en cache persistente
        return true
      } catch (error: any) {
        if (!signal?.aborted) {
          diagnostics.log("fetchProductStats", "Error", { error: error.message })
          console.error("Error al cargar estadísticas de productos:", error)
        }
        return false
      }
    },
    [cache, diagnostics],
  )

  // Cargar datos solo si no están en cache
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    const abortController = diagnostics.trackAbortController("mainLoad")

    diagnostics.log("useEffect", "Starting", {
      retryCount,
      hasStatsCache: cache.hasStats(),
      hasZoneCache: cache.hasZoneStats(),
      hasProductCache: cache.hasProductStats(),
    })

    const loadData = async () => {
      if (!isMounted) {
        diagnostics.log("loadData", "Component unmounted, aborting")
        return
      }

      // Si ya tenemos datos en cache persistente, no cargar nada
      if (cache.hasStats()) {
        diagnostics.log("loadData", "All data in persistent cache, skipping load")
        setLoading(false)

        // Cargar datos secundarios si no están en cache
        if (!cache.hasZoneStats() || !cache.hasProductStats()) {
          setTimeout(() => {
            if (isMounted && !abortController.signal.aborted) {
              Promise.allSettled([
                !cache.hasZoneStats() ? fetchZoneStats(abortController.signal) : Promise.resolve(),
                !cache.hasProductStats() ? fetchProductStats(abortController.signal) : Promise.resolve(),
              ])
            }
          }, 100)
        }
        return
      }

      setLoading(true)
      setError(null)
      diagnostics.log("loadData", "Setting loading=true, error=null")

      // Timeout más corto
      timeoutId = diagnostics.trackTimeout(
        () => {
          if (isMounted) {
            diagnostics.log("loadData", "Timeout reached, aborting")
            abortController.abort()
            setLoading(false)
            setError("Timeout - intenta nuevamente")
            diagnostics.log("loadData", "Setting timeout error")
          }
        },
        6000, // Reducido a 6 segundos
        "mainTimeout",
      )

      // Cargar estadísticas básicas
      const basicStatsSuccess = await fetchBasicStats(abortController.signal)

      if (basicStatsSuccess && isMounted && !abortController.signal.aborted) {
        if (timeoutId) {
          diagnostics.clearTimeout(timeoutId)
          timeoutId = null
        }
        setLoading(false)
        diagnostics.log("loadData", "Basic stats loaded, setting loading=false")

        // Cargar el resto en background
        setTimeout(() => {
          if (isMounted && !abortController.signal.aborted) {
            diagnostics.log("loadData", "Loading secondary stats")
            Promise.allSettled([fetchZoneStats(abortController.signal), fetchProductStats(abortController.signal)])
          }
        }, 100)
      }

      if (isMounted && !abortController.signal.aborted) {
        setLoading(false)
        if (timeoutId) {
          diagnostics.clearTimeout(timeoutId)
          timeoutId = null
        }
        diagnostics.log("loadData", "Load completed")
      }
    }

    loadData()

    return () => {
      diagnostics.log("useEffect", "Cleanup starting")
      isMounted = false

      try {
        abortController.abort()
        if (timeoutId) {
          diagnostics.clearTimeout(timeoutId)
          timeoutId = null
        }
        diagnostics.log("useEffect", "Cleanup completed")
      } catch (e) {
        diagnostics.log("useEffect", "Cleanup error", e)
      }
    }
  }, [retryCount, fetchBasicStats, fetchZoneStats, fetchProductStats, cache, diagnostics])

  const handleRetry = () => {
    diagnostics.log("handleRetry", "Retry triggered - clearing cache")
    cache.clearAll() // Limpiar cache persistente en retry
    setError(null)
    setRetryCount((prev) => prev + 1)
  }

  const handleDiagnostics = () => {
    const report = diagnostics.generateReport()
    const leaks = diagnostics.detectLeaks()
    const cacheStats = cache.getCacheStats()

    console.log("📊 CACHE STATS:", cacheStats)
    console.table(report.recentLogs)

    alert(
      `Diagnostics Report Generated - Check Console\n\nActive Promises: ${report.activePromises.length}\nActive Timeouts: ${report.activeTimeouts.length}\nCache Size: ${cacheStats.size}\nMemory Leaks: ${Object.values(leaks).some(Boolean)}`,
    )
  }

  if (error && !cache.hasStats()) {
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
          <Button onClick={handleDiagnostics} variant="outline" size="icon" title="Ver diagnósticos">
            <Bug className="h-4 w-4" />
          </Button>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !cache.hasStats() ? (
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
            {loading && !cache.hasStats() ? (
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
            <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !cache.hasStats() ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Clientes de la competencia</p>
              <p className="text-xs text-purple-600 font-medium">{stats.totalClientPoints} puntos totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading && !cache.hasStats() ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ventas registradas</p>
              <p className="text-xs text-green-600 font-medium">{stats.totalSalesPoints} puntos totales</p>
              <p className="text-xs text-green-600 font-medium">
                {Math.round((stats.totalSalesPoints / 10) * 10) / 10} kilos totales
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiros Libres</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !cache.hasStats() ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalFreeKicks}</div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tiros libres registrados</p>
              <p className="text-xs text-blue-600 font-medium">{stats.totalFreeKickPoints} puntos totales</p>
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

          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Las estadísticas detalladas por zona están disponibles en el ranking completo.
            </p>
            <Button asChild variant="outline" className="mt-4 bg-transparent">
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
              {loading && !cache.hasProductStats() ? (
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
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
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
