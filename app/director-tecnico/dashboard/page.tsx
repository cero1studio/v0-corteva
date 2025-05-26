import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { BarChart3, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DirectorTecnicoDashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Obtener el perfil del usuario actual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, zone_id, distributor_id")
    .eq("id", session?.user.id)
    .single()

  // Obtener información de la zona
  const { data: zone } = await supabase.from("zones").select("id, name").eq("id", profile?.zone_id).single()

  // Obtener equipos de la zona
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, total_points")
    .eq("zone_id", profile?.zone_id)
    .order("total_points", { ascending: false })

  // Obtener total de ventas por equipo en la zona
  const { data: salesByTeam } = await supabase.rpc("get_sales_by_team_in_zone", { zone_id_param: profile?.zone_id })

  // Obtener total de clientes captados por equipo en la zona
  const { data: clientsByTeam } = await supabase.rpc("get_clients_by_team_in_zone", { zone_id_param: profile?.zone_id })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Director Técnico</h2>
        <p className="text-muted-foreground">
          Bienvenido al panel de control para directores técnicos de {zone?.name || "tu zona"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Equipos en {zone?.name || "tu zona"}</p>
            <Button asChild variant="link" className="px-0">
              <Link href="/director-tecnico/equipos">Ver equipos</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ver posiciones</div>
            <p className="text-xs text-muted-foreground">Clasificación de equipos en tu zona</p>
            <Button asChild variant="link" className="px-0">
              <Link href="/director-tecnico/ranking">Ver ranking</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reportes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Analizar datos</div>
            <p className="text-xs text-muted-foreground">Estadísticas y reportes de tu zona</p>
            <Button asChild variant="link" className="px-0">
              <Link href="/director-tecnico/reportes">Ver reportes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipos en {zone?.name || "tu zona"}</CardTitle>
              <CardDescription>Rendimiento de los equipos en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teams.map((team, index) => (
                        <tr key={team.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {team.total_points || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay equipos en esta zona.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Equipo</CardTitle>
              <CardDescription>Total de ventas por equipo en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {salesByTeam && salesByTeam.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Ventas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesByTeam.map((item) => (
                        <tr key={item.team_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.team_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.total_sales}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.total_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay datos de ventas disponibles.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Captados</CardTitle>
              <CardDescription>Total de clientes captados por equipo en tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              {clientsByTeam && clientsByTeam.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Clientes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientsByTeam.map((item) => (
                        <tr key={item.team_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.team_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.total_clients}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay datos de clientes disponibles.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
