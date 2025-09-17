"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { AuthGuard } from "@/components/auth-guard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getImageUrl } from "@/lib/utils/image"

function DirectorTecnicoVentasContent() {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])
  const [filteredSales, setFilteredSales] = useState<any[]>([])
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
    filterSales()
  }, [sales, searchTerm, teamFilter, captainFilter])

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

        // Obtener ventas
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select(`
            *,
            products(id, name, image_url)
          `)
          .in("representative_id", memberIds)
          .order("created_at", { ascending: false })

        if (salesError) throw salesError

        // Enriquecer datos de ventas
        const enrichedSales =
          salesData?.map((sale) => {
            const representative = teamMembers?.find((member) => member.id === sale.representative_id)
            const team = teamsData?.find((team) => team.id === representative?.team_id)

            return {
              ...sale,
              representative_name: representative?.full_name || "Representante",
              team_name: team?.name || "Equipo",
              team_id: team?.id,
            }
          }) || []

        setSales(enrichedSales)
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudieron cargar las ventas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function filterSales() {
    let filtered = sales

    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.representative_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.team_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (teamFilter !== "all") {
      filtered = filtered.filter((sale) => sale.team_id === teamFilter)
    }

    if (captainFilter !== "all") {
      filtered = filtered.filter((sale) => sale.representative_id === captainFilter)
    }

    setFilteredSales(filtered)
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
          <h1 className="text-3xl font-bold tracking-tight">Ventas de {userData?.zones?.name || "tu zona"}</h1>
          <p className="text-muted-foreground">Supervisa todas las ventas registradas en tu zona</p>
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
                  placeholder="Buscar por producto, capitán o equipo..."
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

      {/* Lista de ventas */}
      <div className="grid gap-4">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md border bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={getImageUrl(sale.products?.image_url) || "/placeholder.svg"}
                        alt={sale.products?.name || "Producto"}
                        className="h-14 w-14 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{sale.products?.name || "Producto"}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{sale.representative_name}</Badge>
                        <Badge variant="outline">{sale.team_name}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">+{sale.points || 0} pts</div>
                    <div className="text-sm text-muted-foreground">Cantidad: {sale.quantity}</div>
                    {sale.client_name && (
                      <div className="text-xs text-muted-foreground mt-1">Cliente: {sale.client_name}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="package"
            title="No se encontraron ventas"
            description="No hay ventas que coincidan con los filtros aplicados"
          />
        )}
      </div>
    </div>
  )
}

export default function DirectorTecnicoVentas() {
  return (
    <AuthGuard allowedRoles={["Director Tecnico"]}>
      <DirectorTecnicoVentasContent />
    </AuthGuard>
  )
}
