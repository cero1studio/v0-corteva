"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { deleteTeam } from "@/app/actions/teams"
import Link from "next/link"
import { Building2, Search, Plus, Edit, Trash2, Users, Trophy, MapPin } from "lucide-react"

interface Team {
  id: string
  name: string
  zone_id: string
  distributor_id: string
  created_at: string
  zones?: { name: string }
  distributors?: { name: string; logo_url?: string }
  _count?: { profiles: number }
  total_points?: number
}

interface Zone {
  id: string
  name: string
}

interface Distributor {
  id: string
  name: string
  logo_url?: string
}

import { getDistributorLogoUrl } from "@/lib/utils/image"
import { bulkDeleteTeams } from "@/app/actions/teams"

export default function TeamsAdminPage() {
  const { toast } = useToast()
  const mountedRef = useRef(true)
  const zonesLoadedRef = useRef(false)
  const distributorsLoadedRef = useRef(false)

  const [teams, setTeams] = useState<Team[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Función para cargar equipos
  const fetchTeams = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          zones(name),
          distributors(name, logo_url),
          profiles!team_id(id)
        `)
        .order("created_at", { ascending: false })

      if (teamsError) throw teamsError

      if (mountedRef.current) {
        const teamsWithCounts =
          data?.map((team) => ({
            ...team,
            _count: { profiles: team.profiles?.length || 0 },
          })) || []

        setTeams(teamsWithCounts)
        console.log("📊 Estado actual:", {
          totalTeams: teamsWithCounts.length,
          filteredTeams: teamsWithCounts.length,
          loading: false,
          error: null,
          searchTerm,
          selectedZone,
        })
      }
    } catch (error: any) {
      if (mountedRef.current) {
        console.error("Error al cargar equipos:", error)
        setError("Error al cargar equipos")
        toast({
          title: "Error",
          description: "No se pudieron cargar los equipos",
          variant: "destructive",
        })
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [toast, searchTerm, selectedZone])

  // Función para cargar zonas
  const fetchZones = useCallback(async () => {
    if (!mountedRef.current || zonesLoadedRef.current) return

    try {
      console.log("📍 Cargando zonas...")
      const { data, error } = await supabase.from("zones").select("id, name").order("name")

      if (error) throw error

      if (mountedRef.current) {
        setZones(data || [])
        zonesLoadedRef.current = true
        console.log("✅ Zonas cargadas:", data?.length || 0)
      }
    } catch (error) {
      console.error("Error al cargar zonas:", error)
    }
  }, [])

  // Función para cargar distribuidores
  const fetchDistributors = useCallback(async () => {
    if (!mountedRef.current || distributorsLoadedRef.current) return

    try {
      console.log("🏢 Cargando distribuidores...")
      const { data, error } = await supabase.from("distributors").select("id, name, logo_url").order("name")

      if (error) throw error

      if (mountedRef.current) {
        setDistributors(data || [])
        distributorsLoadedRef.current = true
        console.log("✅ Distribuidores cargados:", data?.length || 0)
      }
    } catch (error) {
      console.error("Error al cargar distribuidores:", error)
    }
  }, [])

  // Efecto para cargar equipos
  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Efecto separado para cargar zonas
  useEffect(() => {
    if (!zonesLoadedRef.current) {
      fetchZones()
    }
  }, [fetchZones])

  // Efecto separado para cargar distribuidores
  useEffect(() => {
    if (!distributorsLoadedRef.current) {
      fetchDistributors()
    }
  }, [fetchDistributors])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Función para eliminar equipo
  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${teamName}"?`)) {
      return
    }

    try {
      const result = await deleteTeam(teamId)

      if (result.error) throw new Error(result.error)

      setTeams(teams.filter((team) => team.id !== teamId))
      fetchTeams() // To refetch data and counts correctly
      toast({
        title: "Equipo eliminado",
        description: `El equipo "${teamName}" ha sido eliminado correctamente.`,
      })
    } catch (error: any) {
      console.error("Error al eliminar equipo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el equipo",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTeams.length === 0) return
    if (!confirm(`¿Estás seguro de que quieres eliminar los ${selectedTeams.length} equipos seleccionados? Esta acción también eliminará sus ventas, tiros libres y penalizaciones.`)) {
      return
    }

    try {
      setIsBulkDeleting(true)
      const result = await bulkDeleteTeams(selectedTeams)

      if (result.error) throw new Error(result.error)

      setSelectedTeams([])
      fetchTeams()
      toast({
        title: "Equipos eliminados",
        description: `Se han eliminado ${selectedTeams.length} equipos correctamente.`,
      })
    } catch (error: any) {
      console.error("Error al eliminar equipos:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los equipos",
        variant: "destructive",
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Filtrar equipos
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.zones?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.distributors?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesZone = selectedZone === "all" || team.zone_id === selectedZone

    return matchesSearch && matchesZone
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeams(filteredTeams.map((t) => t.id))
    } else {
      setSelectedTeams([])
    }
  }

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={Building2}
        title="Error al cargar equipos"
        description={error}
        actionLabel="Reintentar"
        onClick={fetchTeams}
        className="flex-1 py-20"
        iconClassName="bg-red-50"
      />
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
        <div className="flex items-center gap-2">
          {selectedTeams.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isBulkDeleting ? "Eliminando..." : `Eliminar seleccionados (${selectedTeams.length})`}
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/equipos/nuevo">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Equipo
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra equipos por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, zona o distribuidor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipos ({filteredTeams.length})</CardTitle>
          <CardDescription>Lista de todos los equipos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTeams.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No hay equipos"
              description={
                searchTerm || selectedZone !== "all"
                  ? "No se encontraron equipos con los filtros aplicados"
                  : "Aún no hay equipos registrados"
              }
              actionLabel="Crear Equipo"
              actionHref="/admin/equipos/nuevo"
              className="py-10"
              iconClassName="bg-blue-50"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={filteredTeams.length > 0 && selectedTeams.length === filteredTeams.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </div>
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead>Miembros</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id} className={selectedTeams.includes(team.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedTeams.includes(team.id)}
                            onChange={() => toggleTeamSelection(team.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Creado: {new Date(team.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {team.zones?.name || "Sin zona"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 overflow-hidden rounded bg-gray-100 border border-gray-200">
                            <img
                              src={getDistributorLogoUrl({
                                name: team.distributors?.name || "",
                                logo_url: team.distributors?.logo_url || null,
                              })}
                              alt={`Logo ${team.distributors?.name}`}
                              className="object-contain w-full h-full p-1"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=32&width=64&text=Logo"
                              }}
                            />
                          </div>
                          <span className="text-sm">{team.distributors?.name || "Sin distribuidor"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {team._count?.profiles || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {team.total_points || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/equipos/editar/${team.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(team.id, team.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
