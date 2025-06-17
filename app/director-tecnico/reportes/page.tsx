import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

interface ReportesPageProps {
  searchParams: { team?: string }
}

export default async function DirectorTecnicoReportesPage({ searchParams }: ReportesPageProps) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Obtener el perfil del usuario actual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, zone_id")
    .eq("id", session?.user.id)
    .single()

  // Obtener información de la zona
  const { data: zone } = await supabase.from("zones").select("id, name").eq("id", profile?.zone_id).single()

  // Obtener equipos de la zona
  const { data: teams } = await supabase.from("teams").select("id, name").eq("zone_id", profile?.zone_id).order("name")

  const selectedTeamId = searchParams.team
  const teamIds = selectedTeamId ? [selectedTeamId] : teams?.map((team) => team.id) || []

  // Obtener ventas de los equipos (filtradas por equipo si se selecciona)
  let salesQuery = supabase
    .from("sales")
    .select(`
    id,
    quantity,
    points,
    created_at,
    team_id,
    representative_id,
    teams!sales_team_id_fkey(name),
    products!sales_product_id_fkey(name),
    profiles!sales_representative_id_fkey(full_name)
  `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (teamIds.length > 0) {
    salesQuery = salesQuery.in("team_id", teamIds)
  }

  const { data: sales } = await salesQuery

  // Obtener clientes de competencia (filtrados por equipo si se selecciona)
  let clientsQuery = supabase
    .from("competitor_clients")
    .select(`
    id,
    client_name,
    created_at,
    team_id,
    representative_id,
    teams!left(name),
    profiles!left(full_name)
  `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (teamIds.length > 0) {
    clientsQuery = clientsQuery.in("team_id", teamIds)
  }

  const { data: clients } = await clientsQuery

  // Obtener tiros libres (filtrados por equipo si se selecciona)
  let freeKicksQuery = supabase
    .from("free_kick_goals")
    .select(`
    id,
    points,
    created_at,
    team_id,
    teams!left(name)
  `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (teamIds.length > 0) {
    freeKicksQuery = freeKicksQuery.in("team_id", teamIds)
  }

  const { data: freeKicks } = await freeKicksQuery

  // Calcular estadísticas
  const totalSales = sales?.length || 0
  const totalSalesPoints = sales?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0
  const totalClients = clients?.length || 0
  const totalClientsPoints = totalClients * 200
  const totalFreeKicks = freeKicks?.length || 0
  const totalFreeKickPoints = freeKicks?.reduce((sum, fk) => sum + (fk.points || 0), 0) || 0

  const selectedTeam = teams?.find((team) => team.id === selectedTeamId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Reportes de {selectedTeam?.name || zone?.name || "mi zona"}
          </h2>
          <p className="text-muted-foreground">
            {selectedTeam
              ? `Estadísticas específicas del equipo ${selectedTeam.name}`
              : "Visualiza las estadísticas y actividades de los equipos en tu zona"}
          </p>
        </div>

        {/* Filtro por equipo */}
        <div className="w-full md:w-64">
          <Select value={selectedTeamId || "all"}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <a href="/director-tecnico/reportes">Todos los equipos</a>
              </SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <a href={`/director-tecnico/reportes?team=${team.id}`}>{team.name}</a>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSales}</div>
            <p className="text-xs text-gray-500">{totalSalesPoints} puntos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clientes Captados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalClients}</div>
            <p className="text-xs text-gray-500">{totalClientsPoints} puntos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tiros Libres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalFreeKicks}</div>
            <p className="text-xs text-gray-500">{totalFreeKickPoints} puntos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalSalesPoints + totalClientsPoints + totalFreeKickPoints}
            </div>
            <p className="text-xs text-gray-500">
              {Math.floor((totalSalesPoints + totalClientsPoints + totalFreeKickPoints) / 100)} goles
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="free-kicks">Tiros Libres</TabsTrigger>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimas ventas</CardTitle>
              <CardDescription>
                {selectedTeam ? `Ventas del equipo ${selectedTeam.name}` : "Ventas recientes de los equipos en tu zona"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sales && sales.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Representante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.teams?.name || "Sin equipo"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.profiles?.full_name || "Desconocido"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.products?.name || "Desconocido"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                            {sale.points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>
                  No hay ventas registradas
                  {selectedTeam ? ` para el equipo ${selectedTeam.name}` : " para los equipos de esta zona"}.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes captados</CardTitle>
              <CardDescription>
                {selectedTeam
                  ? `Clientes captados por el equipo ${selectedTeam.name}`
                  : "Clientes de competencia captados por los equipos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients && clients.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Representante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {client.teams?.name || "Desconocido"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.profiles?.full_name || "Desconocido"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.client_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">200</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(client.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>
                  No hay clientes registrados
                  {selectedTeam ? ` para el equipo ${selectedTeam.name}` : " para los equipos de esta zona"}.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free-kicks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tiros libres</CardTitle>
              <CardDescription>
                {selectedTeam
                  ? `Tiros libres del equipo ${selectedTeam.name}`
                  : "Tiros libres registrados por los equipos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {freeKicks && freeKicks.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {freeKicks.map((freeKick) => (
                        <tr key={freeKick.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {freeKick.teams?.name || "Desconocido"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                            {freeKick.points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(freeKick.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>
                  No hay tiros libres registrados
                  {selectedTeam ? ` para el equipo ${selectedTeam.name}` : " para los equipos de esta zona"}.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipos en {zone?.name || "tu zona"}</CardTitle>
              <CardDescription>Lista de equipos y sus estadísticas</CardDescription>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ventas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clientes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiros Libres
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teams.map((team) => {
                        const teamSales = sales?.filter((s) => s.team_id === team.id).length || 0
                        const teamClients = clients?.filter((c) => c.team_id === team.id).length || 0
                        const teamFreeKicks = freeKicks?.filter((fk) => fk.team_id === team.id).length || 0

                        return (
                          <tr key={team.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {team.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                              {teamSales}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                              {teamClients}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                              {teamFreeKicks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <a
                                href={`/director-tecnico/reportes?team=${team.id}`}
                                className="text-corteva-600 hover:text-corteva-700 font-medium"
                              >
                                Ver detalles
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay equipos en esta zona.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
