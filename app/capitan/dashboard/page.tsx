"use client"

import { useAuth } from "@/components/auth-provider"
import { useCachedData } from "@/lib/data-cache"
import { optimizedQueries } from "@/lib/optimized-queries"
import { PageLoader } from "@/components/page-loader"
import { DashboardSkeleton } from "@/components/skeleton-loader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, MapPin } from "lucide-react"

export default function CaptainDashboard() {
  const { profile } = useAuth()

  // Usar caché para datos del dashboard del capitán
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useCachedData(
    `captain_dashboard_${profile?.team_id}`,
    () => optimizedQueries.getCaptainDashboardData(profile?.team_id!),
    { key: `captain_dashboard_${profile?.team_id}`, expiresIn: 1 * 60 * 1000 }, // 1 minuto
  )

  if (!profile?.team_id) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bienvenido, Capitán</h1>
          <p className="text-gray-600 mb-4">Necesitas crear o unirte a un equipo para continuar.</p>
          <a href="/capitan/crear-equipo" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Crear Equipo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard del Capitán</h1>
        <p className="text-gray-600">Gestiona tu equipo y revisa el progreso</p>
      </div>

      <PageLoader isLoading={isLoading} error={error} fallback={<DashboardSkeleton />}>
        {dashboardData && (
          <div className="space-y-6">
            {/* Team Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>{dashboardData.team.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>Zona: {dashboardData.team.zone?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>Puntos: {dashboardData.team.total_points}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Miembros: {dashboardData.members.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Miembros del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.members.map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                      <span>{member.full_name}</span>
                      <span className="text-sm text-gray-500 capitalize">{member.role}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.recentSales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                      <div>
                        <span className="font-medium">{sale.product?.name}</span>
                        <p className="text-sm text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="font-semibold">${sale.amount}</span>
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
