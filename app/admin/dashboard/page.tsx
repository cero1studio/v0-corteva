"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import { chartsCache } from "@/lib/charts-cache"

export default function AdminDashboardPage() {
  const router = useRouter()
  const diagnostics = useDiagnostics("AdminDashboard")
  const cache = usePersistentDashboardCache()

  // Use refs to avoid re-renders
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Función para limpiar recursos
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    loadingRef.current = false
  }, [])

  // Función para obtener estadísticas básicas con mejor manejo de errores
  const fetchBasicStats = useCallback(async () => {
    if (!mountedRef.current || loadingRef.current) return false

    // Verificar cache persistente primero
    if (cache.hasStats()) {
      const cachedStats = cache.getStats()
      setStats(cachedStats)
      return true
    }

    loadingRef.current = true
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      // Timeout más largo y manejo más robusto
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          cleanup()
          setError("Timeout - los datos tardan en cargar")
          setLoading(false)
        }
      }, 15000) // Aumentado a 15 segundos

      const [capitanes, directores, teams, zones, clients, sales, freeKicks] = await Promise.all([
        chartsCache.wrapChartQuery("admin_capitanes", () =>
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "capitan")
            .abortSignal(signal),
        ),
        chartsCache.wrapChartQuery("admin_directores", () =>
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "director_tecnico")
            .abortSignal(signal),
        ),
        chartsCache.wrapChartQuery("admin_teams", () =>
          supabase.from("teams").select("*", { count: "exact", head: true }).abortSignal(signal),
        ),
        chartsCache.wrapChartQuery("admin_zones", () =>
          supabase.from("zones").select("*", { count: "exact", head: true }).abortSignal(signal),
        ),
        chartsCache.wrapChartQuery("admin_clients", () =>
          supabase.from("competitor_clients").select("points").abortSignal(signal),
        ),
        chartsCache.wrapChartQuery("admin_sales", () => supabase.from("sales").select("points").abortSignal(signal)),
        chartsCache.wrapChartQuery("admin_freekicks", () =>
          supabase.from("free_kick_goals").select("points").abortSignal(signal),
        ),
      ])

      if (signal.aborted || !mountedRef.current) return false

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

      if (mountedRef.current) {
        setStats(newStats)
        cache.setStats(newStats)
        setError(null)

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }

      return true
    } catch (error: any) {
      if (!signal.aborted && mountedRef.current) {
        console.error("Error al cargar estadísticas básicas:", error)
        setError("Error al cargar datos")
      }
      return false
    } finally {
      loadingRef.current = false
    }
  }, [cache, cleanup])

  // Función para cargar estadísticas de zonas
  const fetchZoneStats = useCallback(async () => {
    if (!mountedRef.current || cache.hasZoneStats()) {
      if (cache.hasZoneStats()) {
        setZoneStats(cache.getZoneStats())
      }
      return
    }

    try {
      const { data: zones, error } = await supabase.from("zones").select("id, name")

      if (error || !mountedRef.current) return

      const basicZoneStats = zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        teams: 0,
        total_goals: 0,
      }))

      if (mountedRef.current) {
        setZoneStats(basicZoneStats)
        cache.setZoneStats(basicZoneStats)
      }
    } catch (error) {
      console.error("Error al cargar estadísticas de zonas:", error)
    }
  }, [cache])

  // Función para cargar estadísticas de productos
  const fetchProductStats = useCallback(async () => {
    if (!mountedRef.current || cache.hasProductStats()) {
      if (cache.hasProductStats()) {
        setProductStats(cache.getProductStats())
      }
      return
    }

    try {
      const { data, error } = await supabase.from("products").select("id, name")

      if (error || !mountedRef.current) return

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

      if (mountedRef.current) {
        setProductStats(productStatsResults)
        cache.setProductStats(productStatsResults)
      }
    } catch (error) {
      console.error("Error al cargar estadísticas de productos:", error)
    }
  }, [cache])

  // Efecto principal para cargar datos
  useEffect(() => {
    let mounted = true
    mountedRef.current = true

    const loadData = async () => {
      if (!mounted) return

      // Inicializar desde cache si existe
      if (cache.hasStats()) {
        setStats(cache.getStats())
        setLoading(false)
      }
      if (cache.hasZoneStats()) {
        setZoneStats(cache.getZoneStats())
      }
      if (cache.hasProductStats()) {
        setProductStats(cache.getProductStats())
      }

      // Si no hay datos en cache, cargar
      if (!cache.hasStats()) {
        setLoading(true)
        const success = await fetchBasicStats()
        if (mounted) {
          setLoading(false)
        }
      }

      // Cargar datos secundarios en background
      if (mounted) {
        setTimeout(() => {
          if (mounted) {
            fetchZoneStats()
            fetchProductStats()
          }
        }, 100)
      }
    }

    loadData()

    return () => {
      mounted = false
      mountedRef.current = false
      cleanup()
    }
  }, []) // Sin dependencias para evitar loops

  const handleRetry = useCallback(() => {
    cleanup()
    cache.clearAll()
    setError(null)
    setLoading(true)

    // Pequeño delay para evitar race conditions
    setTimeout(async () => {
      if (mountedRef.current) {
        const success = await fetchBasicStats()
        if (mountedRef.current) {
          setLoading(false)
          if (success) {
            fetchZoneStats()
            fetchProductStats()
          }
        }
      }
    }, 100)
  }, [cleanup, cache, fetchBasicStats, fetchZoneStats, fetchProductStats])

  const handleDiagnostics = useCallback(() => {
    const report = diagnostics.generateReport()
    const leaks = diagnostics.detectLeaks()
    const cacheStats = cache.getCacheStats()

    console.log("📊 CACHE STATS:", cacheStats)
    console.table(report.recentLogs)

    alert(
      `Diagnostics Report Generated - Check Console\n\nActive Promises: ${report.activePromises.length}\nActive Timeouts: ${report.activeTimeouts.length}\nCache Size: ${cacheStats.size}\nMemory Leaks: ${Object.values(leaks).some(Boolean)}`,
    )
  }, [diagnostics, cache])

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
