// Agregar el AuthGuard al dashboard de supervisor
// Importar el AuthGuard
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, UserPlus, Trophy } from "lucide-react"
import { SupervisorTeamsChart } from "@/components/charts/supervisor-teams-chart"

// Envolver el contenido de la página con AuthGuard
export default function SupervisorDashboardPage() {
  return (
    <AuthGuard allowedRoles={["supervisor"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard de Supervisor</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Rendimiento de Equipos</CardTitle>
              <CardDescription>Visualiza el rendimiento de los equipos bajo tu supervisión</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <SupervisorTeamsChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipos Destacados</CardTitle>
              <CardDescription>Los equipos con mejor desempeño este mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <span className="font-medium">Equipo Águilas</span>
                  </div>
                  <span className="font-bold">2,450 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <span className="font-medium">Equipo Tigres</span>
                  </div>
                  <span className="font-bold">2,120 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <span className="font-medium">Equipo Leones</span>
                  </div>
                  <span className="font-bold">1,890 pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Las últimas actualizaciones de los equipos bajo tu supervisión</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Equipo Águilas registró 5 nuevas ventas</p>
                    <p className="text-xs text-gray-500">Hace 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Equipo Tigres completó el desafío mensual</p>
                    <p className="text-xs text-gray-500">Hace 5 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Equipo Leones registró 3 nuevos clientes</p>
                    <p className="text-xs text-gray-500">Hace 1 día</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
