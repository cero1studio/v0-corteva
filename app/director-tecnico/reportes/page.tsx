"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"

function DirectorTecnicoReportesContent() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [clientsData, setClientsData] = useState<any[]>([])
  const [teamsData, setTeamsData] = useState<any[]>([])
  const [freeKickData, setFreeKickData] = useState<any[]>([])
  const [zoneData, setZoneData] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedTeamId = searchParams.get("team")

  useEffect(() => {
    loadData()
  }, [selectedTeamId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Obtener el usuario actual
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login")
        return
      }

      console.log("Director Técnico Reportes - Usuario autenticado:", authUser.id)

      // Obtener el perfil del usuario con información detallada
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          zones:zone_id(*)
        `)
        .eq("id", authUser.id)
        .single()

      if (profileError) {
        console.error("Error al obtener perfil:", profileError)
        throw profileError
      }

      console.log("Director Técnico Reportes - Perfil obtenido:", profileData)

      setUserData(profileData)

      // Guardar datos de zona del perfil del usuario
      if (profileData.zones) {
        setZoneData(profileData.zones)
        console.log("Director Técnico Reportes - Zona asignada:", profileData.zones)
      }

      // Cargar datos de la zona
      if (profileData.zone_id) {
        console.log("Director Técnico Reportes - Cargando datos de zona:", profileData.zone_id)
        await loadZoneData(profileData.zone_id)
      } else {
        console.warn("Director Técnico Reportes - No tiene zona asignada")
      }
    } catch (error: any) {
      console.error("Error al verificar usuario:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo cargar la información del usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast({
      title: "Actualizado",
      description: "Los datos han sido actualizados correctamente",
    })
  }

  async function loadZoneData(zoneId: string) {
    try {
      if (!zoneId) {
        console.warn("Director Técnico Reportes - No se proporcionó zoneId")
        return
      }

      console.log("Director Técnico Reportes - Iniciando carga de datos para zona:", zoneId)

      // 1. Obtener equipos de la zona
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          zone_id,
          distributor_id,
          distributors!left(id, name, logo_url)
        `)
        .eq("zone_id", zoneId)

      if (teamsError) {
        console.error("Director Técnico Reportes - Error al obtener equipos:", teamsError)
        throw teamsError
      }

      console.log("Director Técnico Reportes - Equipos encontrados:", teams?.length || 0, teams)

      if (!teams || teams.length === 0) {
        console.log("Director Técnico Reportes - No hay equipos en esta zona")
        setTeamsData([])
        setSalesData([])
        setClientsData([])
        setFreeKickData([])
        return
      }

      const teamIds = selectedTeamId ? [selectedTeamId] : teams.map((t) => t.id)
      console.log("Director Técnico Reportes - IDs de equipos a consultar:", teamIds)

      // 2. Obtener todos los miembros de los equipos de la zona
      const { data: allMembers, error: membersError } = await supabase
        .from("profiles")
        .select("id, team_id, full_name")
        .in("team_id", teamIds)

      if (membersError) {
        console.error("Director Técnico Reportes - Error al obtener miembros:", membersError)
      }

      const memberIds = allMembers?.map((m) => m.id) || []
      console.log("Director Técnico Reportes - Miembros encontrados:", allMembers?.length || 0)

      // 3. Cargar datos en paralelo
      const [salesResult, clientsResult, freeKicksResult] = await Promise.allSettled([
        // Ventas: buscar por representative_id (miembros) Y por team_id (equipos)
        Promise.all([
          memberIds.length > 0
            ? supabase
                .from("sales")
                .select(`
                  id, points, quantity, created_at, product_id, representative_id, team_id,
                  products(name, image_url),
                  profiles(full_name, team_id)
                `)
                .in("representative_id", memberIds)
                .order("created_at", { ascending: false })
                .limit(200)
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from("sales")
            .select(`
              id, points, quantity, created_at, product_id, representative_id, team_id,
              products(name, image_url),
              profiles(full_name, team_id)
            `)
            .in("team_id", teamIds)
            .order("created_at", { ascending: false })
            .limit(200),
        ]).then(([salesByRep, salesByTeam]) => {
          const allSales = [...(salesByRep.data || []), ...(salesByTeam.data || [])]
          // Eliminar duplicados por ID
          const uniqueSales = allSales.filter((sale, index, self) => index === self.findIndex((s) => s.id === sale.id))
          return { data: uniqueSales, error: null }
        }),

        // Clientes: buscar por representative_id (miembros) Y por team_id (equipos)
        Promise.all([
          memberIds.length > 0
            ? supabase
                .from("competitor_clients")
                .select(`
                  id, ganadero_name, client_name, created_at, representative_id, team_id,
                  profiles(full_name, team_id)
                `)
                .in("representative_id", memberIds)
                .order("created_at", { ascending: false })
                .limit(200)
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from("competitor_clients")
            .select(`
              id, ganadero_name, client_name, created_at, representative_id, team_id,
              profiles(full_name, team_id)
            `)
            .in("team_id", teamIds)
            .order("created_at", { ascending: false })
            .limit(200),
        ]).then(([clientsByRep, clientsByTeam]) => {
          const allClients = [...(clientsByRep.data || []), ...(clientsByTeam.data || [])]
          // Eliminar duplicados por ID
          const uniqueClients = allClients.filter(
            (client, index, self) => index === self.findIndex((c) => c.id === client.id),
          )
          return { data: uniqueClients, error: null }
        }),

        // Tiros libres: buscar por team_id
        supabase
          .from("free_kick_goals")
          .select(`
            id, points, reason, created_at, team_id,
            teams(name)
          `)
          .in("team_id", teamIds)
          .order("created_at", { ascending: false })
          .limit(200),
      ])

      // Procesar resultados
      const salesData = salesResult.status === "fulfilled" ? salesResult.value.data || [] : []
      const clientsData = clientsResult.status === "fulfilled" ? clientsResult.value.data || [] : []
      const freeKicksData = freeKicksResult.status === "fulfilled" ? freeKicksResult.value.data || [] : []

      console.log("Director Técnico Reportes - Datos cargados:")
      console.log("- Ventas:", salesData.length)
      console.log("- Clientes:", clientsData.length)
      console.log("- Tiros libres:", freeKicksData.length)

      // Enriquecer datos con información de equipos
      const enrichedSales = salesData.map((sale) => {
        // Primero intentar encontrar el equipo por team_id de la venta
        let team = teams?.find((team) => team.id === sale.team_id)

        // Si no se encuentra y hay un representante, usar el team_id del representante
        if (!team && sale.profiles?.team_id) {
          team = teams?.find((team) => team.id === sale.profiles.team_id)
        }

        return {
          ...sale,
          teams: team || { name: "Desconocido" },
        }
      })

      const enrichedClients = clientsData.map((client) => ({
        ...client,
        teams: teams?.find((team) => team.id === client.team_id) || { name: "Desconocido" },
      }))

      // Actualizar estados
      setTeamsData(teams)
      setSalesData(enrichedSales)
      setClientsData(enrichedClients)
      setFreeKickData(freeKicksData)

      console.log("Director Técnico Reportes - Datos actualizados en estado")
    } catch (error: any) {
      console.error("Director Técnico Reportes - Error al cargar datos de la zona:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la zona",
        variant: "destructive",
      })
    }
  }

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  // Calcular estadísticas
  const totalSales = salesData.length
  const totalSalesPoints = salesData.reduce((sum, sale) => sum + (sale.points || 0), 0)
  const totalClients = clientsData.length
  const totalClientsPoints = totalClients * 200
  const totalFreeKicks = freeKickData.length
  const totalFreeKickPoints = freeKickData.reduce((sum, freeKick) => sum + (freeKick.points || 0), 0)

  const selectedTeam = teamsData?.find((team) => team.id === selectedTeamId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Reportes de {selectedTeam?.name || zoneData?.name || "mi zona"}
          </h2>
          <p className="text-muted-foreground">
            {selectedTeam
              ? `Estadísticas específicas del equipo ${selectedTeam.name}`
              : "Visualiza las estadísticas y actividades de los equipos en tu zona"}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Botón de actualizar */}
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          {/* Filtro por equipo */}
          <div className="w-full md:w-64">
            <Select
              value={selectedTeamId || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  router.push("/director-tecnico/reportes")
                } else {
                  router.push(`/director-tecnico/reportes?team=${value}`)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {teamsData?.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <p className="text-xs text-gray-500">{totalSalesPoints.toLocaleString()} puntos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clientes Captados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalClients}</div>
            <p className="text-xs text-gray-500">{totalClientsPoints.toLocaleString()} puntos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tiros Libres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalFreeKicks}</div>
            <p className="text-xs text-gray-500">{totalFreeKickPoints.toLocaleString()} puntos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(totalSalesPoints + totalClientsPoints + totalFreeKickPoints).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              {Math.floor((totalSalesPoints + totalClientsPoints + totalFreeKickPoints) / 100)} goles
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Ventas ({totalSales})</TabsTrigger>
          <TabsTrigger value="clients">Clientes ({totalClients})</TabsTrigger>
          <TabsTrigger value="free-kicks">Tiros Libres ({totalFreeKicks})</TabsTrigger>
          <TabsTrigger value="teams">Equipos ({teamsData?.length || 0})</TabsTrigger>
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
              {salesData && salesData.length > 0 ? (
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
                      {salesData.slice(0, 50).map((sale) => (
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
                            {sale.points?.toLocaleString()}
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay ventas registradas
                    {selectedTeam ? ` para el equipo ${selectedTeam.name}` : " para los equipos de esta zona"}.
                  </p>
                </div>
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
              {clientsData && clientsData.length > 0 ? (
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
                      {clientsData.slice(0, 50).map((client) => (
                        <tr key={client.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {client.teams?.name || "Desconocido"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.profiles?.full_name || "Desconocido"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.ganadero_name || client.client_name || "Cliente"}
                          </td>
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay clientes registrados
                    {selectedTeam ? ` para el equipo ${selectedTeam.name}` : " para los equipos de esta zona"}.
                  </p>
                </div>
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
              {freeKickData && freeKickData.length > 0 ? (
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
                      {freeKickData.slice(0, 50).map((freeKick) => (
                        <tr key={freeKick.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {freeKick.teams?.name || "Equipo"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                            {freeKick.points?.toLocaleString()}
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay tiros libres registrados
                    {selectedTeam ? ` para el equipo ${selectedTeam.name}` : " para los equipos de esta zona"}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipos en {zoneData?.name || "tu zona"}</CardTitle>
              <CardDescription>Lista de equipos y sus estadísticas</CardDescription>
            </CardHeader>
            <CardContent>
              {teamsData && teamsData.length > 0 ? (
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
                      {teamsData.map((team) => {
                        const teamSales = salesData?.filter((s) => s.team_id === team.id).length || 0
                        const teamClients = clientsData?.filter((c) => c.team_id === team.id).length || 0
                        const teamFreeKicks = freeKickData?.filter((fk) => fk.team_id === team.id).length || 0

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
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay equipos en esta zona.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function DirectorTecnicoReportesPage() {
  return (
    <AuthGuard allowedRoles={["Director Tecnico", "arbitro"]}>
      <DirectorTecnicoReportesContent />
    </AuthGuard>
  )
}
