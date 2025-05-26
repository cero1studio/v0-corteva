"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2, Save, Users, AlertCircle } from "lucide-react"
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
  distributor_id: string
  distributor_name: string
  distributor_logo?: string
  zone_id: string
  zone_name: string
  created_at: string
}

export default function EquiposPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: "",
    zone_id: "",
    distributor_id: "",
  })
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchZones()
    fetchDistributors()
    fetchTeams()
  }, [])

  async function fetchZones() {
    try {
      const { data, error } = await supabase.from("zones").select("id, name").order("name")

      if (error) throw error

      setZones(data || [])
    } catch (error) {
      console.error("Error al cargar zonas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      })
    }
  }

  async function fetchDistributors() {
    try {
      const { data, error } = await supabase.from("distributors").select("id, name, logo_url").order("name")

      if (error) throw error

      setDistributors(data || [])
    } catch (error) {
      console.error("Error al cargar distribuidores:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los distribuidores",
        variant: "destructive",
      })
    }
  }

  async function fetchTeams() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          id, 
          name, 
          distributor_id,
          distributors(id, name, logo_url),
          zone_id,
          zones(id, name),
          created_at
        `)
        .order("name")

      if (error) throw error

      const formattedData = data.map((item) => {
        return {
          id: item.id,
          name: item.name,
          distributor_id: item.distributor_id,
          distributor_name: item.distributors?.name || "Sin distribuidor",
          distributor_logo: item.distributors?.logo_url || null,
          zone_id: item.zone_id,
          zone_name: item.zones?.name || "Sin zona",
          created_at: item.created_at,
        }
      })

      setTeams(formattedData)
    } catch (error: any) {
      console.error("Error al cargar equipos:", error)
      setError(error.message || "Error al cargar equipos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
        .select(`
          id, 
          name, 
          distributor_id,
          distributors(name, logo_url),
          zone_id,
          zones(name),
          created_at
        `)

      if (error) throw error

      const newItem = {
        id: data[0].id,
        name: data[0].name,
        distributor_id: data[0].distributor_id,
        distributor_name: data[0].distributors?.name || "Sin distribuidor",
        distributor_logo: data[0].distributors?.logo_url || null,
        zone_id: data[0].zone_id,
        zone_name: data[0].zones?.name || "Sin zona",
        created_at: data[0].created_at,
      }

      setTeams([...teams, newItem])
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
    if (!editingTeam || !editingTeam.name.trim() || !editingTeam.zone_id || !editingTeam.distributor_id) {
      toast({
        title: "Error",
        description: "El nombre, la zona y el distribuidor son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: editingTeam.name.trim(),
          zone_id: editingTeam.zone_id,
          distributor_id: editingTeam.distributor_id,
        })
        .eq("id", editingTeam.id)

      if (error) throw error

      const zoneName = zones.find((z) => z.id === editingTeam.zone_id)?.name || "Sin zona"
      const distributor = distributors.find((d) => d.id === editingTeam.distributor_id)
      const distributorName = distributor?.name || "Sin distribuidor"
      const distributorLogo = distributor?.logo_url || null

      setTeams(
        teams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...editingTeam,
                zone_name: zoneName,
                distributor_name: distributorName,
                distributor_logo: distributorLogo,
              }
            : team,
        ),
      )

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

      setTeams(teams.filter((team) => team.id !== id))

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

      <Card>
        <CardHeader>
          <CardTitle>Equipos</CardTitle>
          <CardDescription>Administra los equipos para la competición</CardDescription>
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
                description={error}
                action={
                  <Button onClick={fetchTeams} variant="default">
                    Reintentar
                  </Button>
                }
              />
            </div>
          ) : teams.length === 0 ? (
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
                  {teams.map((team) => (
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
                            value={editingTeam.zone_id}
                            onValueChange={(value) => setEditingTeam({ ...editingTeam, zone_id: value })}
                          >
                            <SelectTrigger>
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
                        ) : (
                          <div className="text-sm">{team.zone_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeam?.id === team.id ? (
                          <Select
                            value={editingTeam.distributor_id}
                            onValueChange={(value) => setEditingTeam({ ...editingTeam, distributor_id: value })}
                          >
                            <SelectTrigger>
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
                        ) : (
                          <div className="flex justify-start">
                            <img
                              src={getDistributorLogoUrl({
                                name: team.distributor_name,
                                logo_url: team.distributor_logo || "/placeholder.svg",
                              })}
                              alt={team.distributor_name}
                              title={team.distributor_name}
                              className="h-8 w-16 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=32&width=64&text=Logo"
                              }}
                            />
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
