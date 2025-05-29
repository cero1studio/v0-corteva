// Agregar el AuthGuard al dashboard de capitán
// Importar el AuthGuard
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesChart } from "@/components/sales-chart"
import { GoalProgress } from "@/components/goal-progress"
import { LiveFeed } from "@/components/live-feed"
import { ChallengeCard } from "@/components/challenge-card"

// Envolver el contenido de la página con AuthGuard
export default function CapitanDashboardPage() {
  return (
    <AuthGuard allowedRoles={["capitan"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Ventas Recientes</CardTitle>
              <CardDescription>Visualiza tus ventas recientes y su impacto en tu puntaje</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <SalesChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Meta</CardTitle>
              <CardDescription>Tu avance hacia la meta mensual de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalProgress />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Las últimas actualizaciones de tu equipo y la competencia</CardDescription>
            </CardHeader>
            <CardContent>
              <LiveFeed />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Desafíos Activos</CardTitle>
              <CardDescription>Completa desafíos para ganar puntos extra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ChallengeCard
                  title="5 Nuevos Clientes"
                  description="Registra 5 nuevos clientes este mes"
                  progress={60}
                  reward="500 pts"
                />
                <ChallengeCard
                  title="Venta Premium"
                  description="Vende 3 productos premium"
                  progress={33}
                  reward="300 pts"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
