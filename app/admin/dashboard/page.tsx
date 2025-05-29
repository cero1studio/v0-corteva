// Agregar el AuthGuard al dashboard de admin
// Importar el AuthGuard
import { AuthGuard } from "@/components/auth-guard"
import AdminStatsChart from "@/components/admin-stats-chart"
import AdminRankingChart from "@/components/admin-ranking-chart"
import AdminZonesChart from "@/components/admin-zones-chart"

// Envolver el contenido de la página con AuthGuard
export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2">
          <h1 className="mb-4 text-2xl font-bold">Dashboard de Administrador</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminStatsChart />
            <AdminRankingChart />
          </div>
        </div>
        <div>
          <AdminZonesChart />
        </div>
      </div>
    </AuthGuard>
  )
}
