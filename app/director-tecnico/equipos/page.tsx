"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { AuthGuard } from "@/components/auth-guard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PUNTOS_POR_GOL = 100

function DirectorTecnicoEquiposContent() {
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<any[]>([])
  const [filteredTeams, setFilteredTeams] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [distributorFilter, setDistributorFilter] = useState("all")
  const [distributors, setDistributors] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)
  const [puntosParaGol, setPuntosParaGol] = useState(PUNTOS_POR_GOL)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadSystemConfig()
  }, [])

  useEffect(() => {
    filterTeams()
  }, [teams, searchTerm, distributorFilter])

  async function loadSystemConfig() {
    try {
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("*")
        .eq("key", "puntos_para_gol")
        .single()

      if (!configError && configData) {
        setPuntosParaGol(Number(configData.value) || PUNTOS_POR_GOL)
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  async function loadData() {
    try {
      setLoading(true)

      // Obtener el usuario actual
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      // Obtener el perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
         *,
         zones:zone_id(*)
       `)
        .eq("id", authUser.id)
        .single()

      if (profileError) throw profileError
      setUserData(profileData)

      if (!profileData.zone_id) {
        toast({
          title: "Error",
          description: "No tienes una zona asignada",
          variant: "destructive",
        })
        return
      }

      // Obtener equipos de la zona
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          distributors:distributor_id(*)
        `)
        .eq("zone_id", profileData.zone_id)
        .order("total_points", { ascending: false })

      if (teamsError) throw teamsError

      // Obtener distribuidores únicos
      const uniqueDistributors =
        teamsData
          ?.filter((team) => team.distributors)
          .map((team) => team.distributors)
          .filter((distributor, index, self) => index === self.findIndex((d) => d.id === distributor.id)) || []

      setDistributors(uniqueDistributors)

      // Obtener miembros de los equipos
      const teamIds = teamsData?.map((team) => team.id) || []

      if (teamIds.length > 0) {
        const { data: teamMembers, error: membersError } = await supabase
          .from("profiles")
          .select("id, full_name, team_id")
          .in("team_id", teamIds)

        if (membersError) throw membersError

        const memberIds = teamMembers?.map((member) => member.id) || []

        // Obtener ventas
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .in("representative_id", memberIds)

        if (salesError) throw salesError

        // Obtener clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from("competitor_clients")
          .select("*")
          .in("representative_id", memberIds)

        if (clientsError) throw clientsError

        // Calcular estadísticas por equipo
        const teamsWithStats =
          teamsData?.map((team) => {
            const teamMemberIds = teamMembers?.filter((member) => member.team_id === team.id).map((m) => m.id) || []
            const teamSales = salesData?.filter((sale) => teamMemberIds.includes(sale.representative_id)) || []
            const teamClients = clientsData?.filter((client) => teamMemberIds.includes(client.representative_id)) || []

            const salesPoints = teamSales.reduce((sum, sale) => sum + (sale.points || 0), 0)
            const clientsPoints = teamClients.length * 200
            const totalPoints = salesPoints + clientsPoints
            const totalGoals = Math.floor(totalPoints / puntosParaGol)

            return {
              ...team,
              members_count: teamMemberIds.length,
              sales_count: teamSales.length,
              clients_count: teamClients.length,
              sales_points: salesPoints,
              clients_points: clientsPoints,
              calculated_total_points: totalPoints,
              calculated_total_goals: totalGoals,
            }
          }) || []

        // Ordenar por puntos totales
        teamsWithStats.sort((a, b) => (b.calculated_total_points || 0) - (a.calculated_total_points || 0))
        setTeams(teamsWithStats)
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudieron cargar los equipos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function filterTeams() {
    let filtered = teams

    if (searchTerm) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.distributors?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (distributorFilter !== "all") {
      filtered = filtered.filter((team) => team.distributor_id === distributorFilter)
    }

    setFilteredTeams(filtered)
  }

  function clearFilters() {
    setSearchTerm("")
    setDistributorFilter("all")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipos de {userData?.zones?.name || "tu zona"}</h1>
          <p className="text-muted-foreground">Gestiona y supervisa los equipos de tu zona</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de equipo o distribuidor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={distributorFilter} onValueChange={setDistributorFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por distribuidor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los distribuidores</SelectItem>
                {distributors.map((distributor) => (
                  <SelectItem key={distributor.id} value={distributor.id}>
                    {distributor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de equipos */}
      <div className="grid gap-6">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team, index) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{team.distributors?.name || "Sin distribuidor"}</Badge>
                        <span>•</span>
                        <span>{team.members_count || 0} miembros</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{team.calculated_total_goals || 0} goles</div>
                    <div className="text-sm text-muted-foreground">
                      {(team.calculated_total_points || 0).toLocaleString()} puntos
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{team.sales_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Ventas</div>
                    <div className="text-xs text-muted-foreground">{(team.sales_points || 0).toLocaleString()} pts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{team.clients_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Clientes</div>
                    <div className="text-xs text-muted-foreground">
                      {(team.clients_points || 0).toLocaleString()} pts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{team.members_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Miembros</div>
                    <div className="text-xs text-muted-foreground">Activos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(((team.calculated_total_points || 0) / (puntosParaGol * 10)) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Progreso</div>
                    <div className="text-xs text-muted-foreground">Meta 10 goles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="users"
            title="No se encontraron equipos"
            description="No hay equipos que coincidan con los filtros aplicados"
          />
        )}
      </div>
    </div>
  )
}

export default function DirectorTecnicoEquipos() {
  return (
    <AuthGuard allowedRoles={["Director Tecnico"]}>
      <DirectorTecnicoEquiposContent />
    </AuthGuard>
  )
}
