"use client"

import { useAuth } from "@/components/auth-provider"
import { useCachedData } from "@/lib/data-cache"
import { optimizedQueries } from "@/lib/optimized-queries"
import { PageLoader } from "@/components/page-loader"
import { DashboardSkeleton } from "@/components/skeleton-loader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, ShoppingCart, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const { profile } = useAuth()

  // Usar caché para datos del dashboard
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useCachedData(
    `admin_dashboard_${profile?.id}`,
    () => optimizedQueries.getAdminDashboardData(),
    { key: `admin_dashboard_${profile?.id}`, expiresIn: 2 * 60 * 1000 }, // 2 minutos
  )

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-gray-600">Resumen general del concurso Super Ganadería</p>
      </div>

      <PageLoader isLoading={isLoading} error={error} fallback={<DashboardSkeleton />}>
        {dashboardData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.teamsCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.usersCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.salesCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Equipos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.topTeams.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Top Teams */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Equipos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.topTeams.map((team, index) => (
                    <div key={team.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">#{index + 1}</span>
                        <span>{team.name}</span>
                      </div>
                      <span className="font-semibold">{team.total_points} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageLoader>
    </div>
  )
}
