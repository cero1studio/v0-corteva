"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2, Save, Users, AlertCircle, Search, Filter } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { getDistributorLogoUrl } from "@/lib/utils/image"
import { useCachedList } from "@/lib/global-cache"

interface Zone {
  id: string
  name: string
}

interface Distributor {
  id: string
  name: string
  logo_url?: string
}

interface Team {
  id: string
  name: string
  distributor_id: string | null
  distributor_name: string
  distributor_logo?: string | null
  zone_id: string | null
  zone_name: string
  created_at: string
  distributors?: Distributor | null
  zones?: Zone | null
}

export default function EquiposPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: "",
    zone_id: "",
    distributor_id: "",
  })
  // Controla el estado de “añadiendo equipo” (loading)
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState<string>("all")

  const { toast } = useToast()

  const fetchTeams = useCallback(async () => {
    const { data: teamsData, error } = await supabase
      .from("teams")
      .select(`
      id, 
      name, 
      distributor_id, 
      zone_id, 
      created_at,
      distributors!distributor_id (
        id,
        name,
        logo_url
      ),
      zones!zone_id (
        id,
        name
      )
    `)
      .order("name")

    if (error) throw error

    const formattedData = (teamsData || []).map((team) => ({
      id: team.id,
      name: team.name || "Sin nombre",
      distributor_id: team.distributor_id,
      distributor_name: team.distributors?.name || "Sin distribuidor",
      distributor_logo: team.distributors?.logo_url || null,
      zone_id: team.zone_id,
      zone_name: team.zones?.name || "Sin zona",
      created_at: team.created_at,
    }))

    return formattedData
  }, [])

  const { data: teams, loading, error, refresh } = useCachedList("admin-teams", fetchTeams, [])

  async function fetchZones(signal?: AbortSignal) {
    try {
      console.log("📍 Cargando zonas...")
      const { data, error } = await supabase.from("zones").select("id, name").order("name").abortSignal(signal)

      if (error) throw error
      if (!signal?.aborted) {
        setZones(data || [])
        console.log("✅ Zonas cargadas:", data?.length || 0)
      }
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Error al cargar zonas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las zonas",
          variant: "destructive",
        })
      }
    }
  }

  async function fetchDistributors(signal?: AbortSignal) {
    try {
      console.log("🏢 Cargando distribuidores...")
      const { data, error } = await supabase
        .from("distributors")
        .select("id, name, logo_url")
        .order("name")
        .abortSignal(signal)

      if (error) throw error
      if (!signal?.aborted) {
        setDistributors(data || [])
        console.log("✅ Distribuidores cargados:", data?.length || 0)
      }
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Error al cargar distribuidores:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los distribuidores",
          variant: "destructive",
        })
      }
    }
  }

  async function handleAddTeam() {
    if (!newTeam.name.trim() || !newTeam.zone_id || !newTeam.distributor_id) {
      toast({
        title: "Error",
        description: "El nombre, la zona y el distribuidor son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsAddingTeam(true)
    try {
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: newTeam.name.trim(),
          zone_id: newTeam.zone_id,
          distributor_id: newTeam.distributor_id,
        })
        .select()

      if (error) throw error

      // Recargar la lista completa
      refresh()
      setNewTeam({ name: "", zone_id: "", distributor_id: "" })

      toast({
        title: "Equipo añadido",
        description: "El equipo ha sido añadido exitosamente",
      })
    } catch (error) {
      console.error("Error al añadir equipo:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el equipo",
        variant: "destructive",
      })
    } finally {
      setIsAddingTeam(false)
      setIsDialogOpen(false)
    }
  }

  async function handleUpdateTeam() {
    if (!editingTeam || !editingTeam.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: editingTeam.name.trim(),
          zone_id: editingTeam.zone_id || null,
          distributor_id: editingTeam.distributor_id || null,
        })
        .eq("id", editingTeam.id)

      if (error) throw error

      const zoneName = editingTeam.zone_id
        ? zones.find((z) => z.id === editingTeam.zone_id)?.name || "Sin zona"
        : "Sin zona"
      const distributor = editingTeam.distributor_id
        ? distributors.find((d) => d.id === editingTeam.distributor_id)
        : null
      const distributorName = distributor?.name || "Sin distribuidor"
      const distributorLogo = distributor?.logo_url || null

      refresh()

      toast({
        title: "Equipo actualizado",
        description: "El equipo ha sido actualizado exitosamente",
      })
    } catch (error) {
      console.error("Error al actualizar equipo:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el equipo",
        variant: "destructive",
      })
    } finally {
      setEditingTeam(null)
    }
  }

  async function handleDeleteTeam(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const { error } = await supabase.from("teams").delete().eq("id", id)

      if (error) throw error

      refresh()

      toast({
        title: "Equipo eliminado",
        description: "El equipo ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error al eliminar equipo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el equipo. Asegúrate de que no tenga usuarios asociados.",
        variant: "destructive",
      })
    }
  }

  // Filtrar equipos
  const filteredTeams = (teams || []).filter((team) => {
    const matchesSearch =
      !searchTerm ||
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.distributor_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = selectedZone === "all" || team.zone_id === selectedZone

    return matchesSearch && matchesZone
  })

  console.log("📊 Estado actual:", {
    totalTeams: teams?.length,
    filteredTeams: filteredTeams.length,
    loading,
    error,
    searchTerm,
    selectedZone,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Equipos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Equipo</DialogTitle>
              <DialogDescription>Ingresa los datos del nuevo equipo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Nombre del equipo</Label>
                <Input
                  id="teamName"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Ej: Equipo Campeón"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Zona</Label>
                <Select value={newTeam.zone_id} onValueChange={(value) => setNewTeam({ ...newTeam, zone_id: value })}>
                  <SelectTrigger id="zone">
                    <SelectValue placeholder="Selecciona una zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="distributor">Distribuidor</Label>
                <Select
                  value={newTeam.distributor_id}
                  onValueChange={(value) => setNewTeam({ ...newTeam, distributor_id: value })}
                >
                  <SelectTrigger id="distributor">
                    <SelectValue placeholder="Selecciona un distribuidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {distributors.map((distributor) => (
                      <SelectItem key={distributor.id} value={distributor.id}>
                        {distributor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setNewTeam({ name: "", zone_id: "", distributor_id: "" })
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddTeam} disabled={isAddingTeam}>
                {isAddingTeam ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Añadiendo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o distribuidor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zone">Zona</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las zonas" />
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
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedZone("all")
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipos</CardTitle>
          <CardDescription>
            {filteredTeams.length} equipo{filteredTeams.length !== 1 ? "s" : ""} encontrado
            {filteredTeams.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
            </div>
          ) : error ? (
            <div className="py-8">
              <EmptyState
                icon={AlertCircle}
                title="Error al cargar equipos"
                description={error?.message}
                action={
                  <Button onClick={refresh} variant="default">
                    Reintentar
                  </Button>
                }
              />
            </div>
          ) : filteredTeams.length === 0 && teams?.length > 0 ? (
            <div className="py-8">
              <EmptyState
                icon={Users}
                title="No se encontraron equipos"
                description="No se encontraron equipos con los filtros aplicados"
                action={
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedZone("all")
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                }
              />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={Users}
                title="No hay equipos registrados"
                description="Crea un nuevo equipo para comenzar la competición"
                action={
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Equipo
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        {editingTeam?.id === team.id ? (
                          <Input
                            value={editingTeam.name}
                            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                          />
                        ) : (
                          <div className="font-medium">{team.name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeam?.id === team.id ? (
                          <Select
                            value={editingTeam.zone_id || ""}
                            onValueChange={(value) => setEditingTeam({ ...editingTeam, zone_id: value || null })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una zona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">Sin zona</SelectItem>
                              {zones.map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                  {zone.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm">{team.zone_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeam?.id === team.id ? (
                          <Select
                            value={editingTeam.distributor_id || ""}
                            onValueChange={(value) => setEditingTeam({ ...editingTeam, distributor_id: value || null })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un distribuidor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">Sin distribuidor</SelectItem>
                              {distributors.map((distributor) => (
                                <SelectItem key={distributor.id} value={distributor.id}>
                                  {distributor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex justify-start">
                            {team.distributor_logo ? (
                              <img
                                src={getDistributorLogoUrl(team) || "/placeholder.svg"}
                                alt={team.distributor_name}
                                title={team.distributor_name}
                                className="h-8 w-16 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=32&width=64&text=Logo"
                                }}
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">{team.distributor_name}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingTeam?.id === team.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleUpdateTeam}
                              className="text-green-500 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                              <span className="sr-only">Guardar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTeam(null)
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingTeam(team)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTeam(team.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        )}
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
