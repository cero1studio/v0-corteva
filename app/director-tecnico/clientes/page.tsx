"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, User, Filter, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { AuthGuard } from "@/components/auth-guard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function DirectorTecnicoClientesContent() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [filteredClients, setFilteredClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [captainFilter, setCaptainFilter] = useState("all")
  const [teams, setTeams] = useState<any[]>([])
  const [captains, setCaptains] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, teamFilter, captainFilter])

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
        .select("*")
        .eq("zone_id", profileData.zone_id)

      if (teamsError) throw teamsError
      setTeams(teamsData || [])

      // Obtener miembros de los equipos
      const teamIds = teamsData?.map((team) => team.id) || []

      if (teamIds.length > 0) {
        const { data: teamMembers, error: membersError } = await supabase
          .from("profiles")
          .select("id, full_name, team_id")
          .in("team_id", teamIds)

        if (membersError) throw membersError

        const memberIds = teamMembers?.map((member) => member.id) || []

        // Obtener capitanes únicos
        const uniqueCaptains =
          teamMembers?.filter((member, index, self) => index === self.findIndex((m) => m.id === member.id)) || []
        setCaptains(uniqueCaptains)

        // Obtener clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from("competitor_clients")
          .select("*")
          .in("representative_id", memberIds)
          .order("created_at", { ascending: false })

        if (clientsError) throw clientsError

        // Enriquecer datos de clientes
        const enrichedClients =
          clientsData?.map((client) => {
            const representative = teamMembers?.find((member) => member.id === client.representative_id)
            const team = teamsData?.find((team) => team.id === representative?.team_id)

            return {
              ...client,
              representative_name: representative?.full_name || "Representante",
              team_name: team?.name || "Equipo",
              team_id: team?.id,
            }
          }) || []

        setClients(enrichedClients)
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function filterClients() {
    let filtered = clients

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          (client.ganadero_name || client.client_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.representative_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.producto_anterior || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (teamFilter !== "all") {
      filtered = filtered.filter((client) => client.team_id === teamFilter)
    }

    if (captainFilter !== "all") {
      filtered = filtered.filter((client) => client.representative_id === captainFilter)
    }

    setFilteredClients(filtered)
  }

  function clearFilters() {
    setSearchTerm("")
    setTeamFilter("all")
    setCaptainFilter("all")
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
          <h1 className="text-3xl font-bold tracking-tight">Clientes de {userData?.zones?.name || "tu zona"}</h1>
          <p className="text-muted-foreground">Supervisa todos los clientes registrados en tu zona</p>
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
                  placeholder="Buscar por cliente, capitán, equipo o competidor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={captainFilter} onValueChange={setCaptainFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por capitán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los capitanes</SelectItem>
                {captains.map((captain) => (
                  <SelectItem key={captain.id} value={captain.id}>
                    {captain.full_name}
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

      {/* Lista de clientes */}
      <div className="grid gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {client.ganadero_name || client.client_name || "Cliente"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{client.representative_name}</Badge>
                        <Badge variant="outline">{client.team_name}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(client.created_at).toLocaleDateString()}
                      </div>
                      {client.ubicacion && (
                        <div className="text-sm text-muted-foreground mt-1">📍 {client.ubicacion}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">+200 pts</div>
                    <div className="text-sm text-muted-foreground">Cliente registrado</div>
                    {client.producto_anterior && (
                      <Badge variant="destructive" className="mt-2">
                        Competidor: {client.producto_anterior}
                      </Badge>
                    )}
                    {client.volumen_venta_estimado && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Vol. estimado: {client.volumen_venta_estimado}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="user"
            title="No se encontraron clientes"
            description="No hay clientes que coincidan con los filtros aplicados"
          />
        )}
      </div>
    </div>
  )
}

export default function DirectorTecnicoClientes() {
  return (
    <AuthGuard allowedRoles={["Director Tecnico"]}>
      <DirectorTecnicoClientesContent />
    </AuthGuard>
  )
}
