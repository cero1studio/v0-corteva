"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { createClientSupabaseClient } from "@/lib/supabase/client"

interface Team {
  id: string
  name: string
  zone_id: string
}

interface Sale {
  id: string
  quantity: number
  points: number
  created_at: string
  team_id: string
  representative_id: string
  teams?: { name: string }
  products?: { name: string }
  profiles?: { full_name: string }
}

interface Client {
  id: string
  client_name: string
  created_at: string
  team_id: string
  representative_id: string
  teams?: { name: string }
  profiles?: { full_name: string }
}

interface FreeKick {
  id: string
  points: number
  created_at: string
  team_id: string
  teams?: { name: string }
}

export default function DirectorTecnicoReportesPage() {
  const { profile } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [freeKicks, setFreeKicks] = useState<FreeKick[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [zone, setZone] = useState<{ id: string; name: string } | null>(null)

  const supabase = createClientSupabaseClient()

  useEffect(() => {
    if (profile?.zone_id) {
      loadData()
    }
  }, [profile?.zone_id])

  useEffect(() => {
    if (teams.length > 0) {
      loadReportsData()
    }
  }, [selectedTeamId, teams])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log("Loading data for zone:", profile?.zone_id)

      // Obtener información de la zona
      const { data: zoneData, error: zoneError } = await supabase
        .from("zones")
        .select("id, name")
        .eq("id", profile?.zone_id)
        .single()

      if (zoneError) {
        console.error("Error loading zone:", zoneError)
      } else {
        setZone(zoneData)
        console.log("Zone loaded:", zoneData)
      }

      // Obtener equipos de la zona
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, zone_id")
        .eq("zone_id", profile?.zone_id)
        .order("name")

      if (teamsError) {
        console.error("Error loading teams:", teamsError)
      } else {
        setTeams(teamsData || [])
        console.log("Teams loaded:", teamsData?.length || 0)
      }
    } catch (error) {
      console.error("Error in loadData:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadReportsData = async () => {
    try {
      const teamIds = selectedTeamId === "all" ? teams.map((team) => team.id) : [selectedTeamId]
      console.log("Loading reports for teams:", teamIds)

      if (teamIds.length === 0) return

      // Cargar ventas con información completa
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          id,
          quantity,
          points,
          created_at,
          team_id,
          representative_id,
          teams!inner(name),
          products(name),
          profiles(full_name)
        `)
        .in("team_id", teamIds)
        .order("created_at", { ascending: false })
        .limit(100)

      if (salesError) {
        console.error("Error loading sales:", salesError)
      } else {
        setSales(salesData || [])
        console.log("Sales loaded:", salesData?.length || 0)
      }

      // Cargar clientes con información completa
      const { data: clientsData, error: clientsError } = await supabase
        .from("competitor_clients")
        .select(`
          id,
          client_name,
          created_at,
          team_id,
          representative_id,
          teams!inner(name),
          profiles(full_name)
        `)
        .in("team_id", teamIds)
        .order("created_at", { ascending: false })
        .limit(100)

      if (clientsError) {
        console.error("Error loading clients:", clientsError)
      } else {
        setClients(clientsData || [])
        console.log("Clients loaded:", clientsData?.length || 0)
      }

      // Cargar tiros libres con información completa
      const { data: freeKicksData, error: freeKicksError } = await supabase
        .from("free_kick_goals")
        .select(`
          id,
          points,
          created_at,
          team_id,
          teams!inner(name)
        `)
        .in("team_id", teamIds)
        .order("created_at", { ascending: false })
        .limit(100)

      if (freeKicksError) {
        console.error("Error loading free kicks:", freeKicksError)
      } else {
        setFreeKicks(freeKicksData || [])
        console.log("Free kicks loaded:", freeKicksData?.length || 0)
      }
    } catch (error) {
      console.error("Error in loadReportsData:", error)
    }
  }

  // Calcular estadísticas
  const totalSales = sales?.length || 0
  const totalSalesPoints = sales?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0
  const totalClients = clients?.length || 0
  const totalClientsPoints = totalClients * 200
  const totalFreeKicks = freeKicks?.length || 0
  const totalFreeKickPoints = freeKicks?.reduce((sum, fk) => sum + (fk.points || 0), 0) || 0

  const selectedTeam = teams?.find((team) => team.id === selectedTeamId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    )
  }

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
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los equipos</SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>Debug:</strong> Zone: {zone?.name} | Teams: {teams.length} | Selected: {selectedTeamId} | Sales:{" "}
              {sales.length} | Clients: {clients.length} | Free Kicks: {freeKicks.length}
            </p>
          </CardContent>
        </Card>
      )}

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
                            {sale.teams?.name || "Desconocido"}
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
                              <button
                                onClick={() => setSelectedTeamId(team.id)}
                                className="text-corteva-600 hover:text-corteva-700 font-medium"
                              >
                                Ver detalles
                              </button>
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
