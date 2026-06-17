"use client"

import { useState, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2, Save, Search, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCachedList } from "@/lib/global-cache"
import { createZone, updateZone, deleteZone, bulkDeleteZones } from "@/app/actions/zones"

interface Zone {
  id: string
  name: string
  created_at: string
}

export default function ZonasPage() {
  const [newZoneName, setNewZoneName] = useState("")
  const [isAddingZone, setIsAddingZone] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [isZonesLoaded, setIsZonesLoaded] = useState(false)
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const fetchZones = useCallback(async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout: La consulta tardó demasiado")), 5000),
    )

    const fetchPromise = supabase.from("zones").select("*").order("name")
    const result = (await Promise.race([fetchPromise, timeoutPromise])) as any

    if (result.error) throw result.error
    return result.data || []
  }, [])

  const { data: zones, loading, error, refresh } = useCachedList("admin-zones", fetchZones, [])

  // Filtrar zonas basándose en el término de búsqueda
  const filteredZones = useMemo(() => {
    if (!searchTerm.trim()) return zones

    const searchLower = searchTerm.toLowerCase().trim()
    return zones.filter((zone) => zone.name.toLowerCase().includes(searchLower))
  }, [zones, searchTerm])

  const clearSearch = () => {
    setSearchTerm("")
  }

  async function handleAddZone() {
    if (!newZoneName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la zona no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setIsAddingZone(true)

    try {
      const formData = new FormData()
      formData.append("name", newZoneName.trim())

      const result = await createZone(formData)

      if (result.error) throw new Error(result.error)

      await refresh(true)
      setNewZoneName("")
      toast({
        title: "Zona añadida",
        description: "La zona ha sido añadida exitosamente",
      })
    } catch (error: any) {
      console.error("Error al añadir zona:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir la zona: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsAddingZone(false)
      setIsDialogOpen(false)
    }
  }

  async function handleUpdateZone() {
    if (!editingZone || !editingZone.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la zona no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append("name", editingZone.name.trim())

      const result = await updateZone(editingZone.id, formData)

      if (result.error) throw new Error(result.error)

      await refresh(true)

      toast({
        title: "Zona actualizada",
        description: "La zona ha sido actualizada exitosamente",
      })
    } catch (error: any) {
      console.error("Error al actualizar zona:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la zona: " + error.message,
        variant: "destructive",
      })
    } finally {
      setEditingZone(null)
    }
  }

  async function handleDeleteZone(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta zona? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const result = await deleteZone(id)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      await refresh(true)

      toast({
        title: "Zona eliminada",
        description: "La zona ha sido eliminada exitosamente",
      })
    } catch (error: any) {
      console.error("Error al eliminar zona:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona.",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedZones.length === 0) return
    if (!confirm(`¿Estás seguro de que quieres eliminar las ${selectedZones.length} zonas seleccionadas? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setIsBulkDeleting(true)
      const result = await bulkDeleteZones(selectedZones)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Zonas eliminadas",
          description: `Se han eliminado ${selectedZones.length} zonas exitosamente`,
        })
        setSelectedZones([])
        await refresh(true)
      }
    } catch (error: any) {
      console.error("Error al eliminar zonas:", error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar las zonas: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedZones(filteredZones.map((z) => z.id))
    } else {
      setSelectedZones([])
    }
  }

  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZones((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Zonas</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedZones.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isBulkDeleting ? "Eliminando..." : `Eliminar seleccionados (${selectedZones.length})`}
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Zona
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Nueva Zona</DialogTitle>
                <DialogDescription>Ingresa el nombre de la nueva zona geográfica</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="zoneName">Nombre de la zona</Label>
                  <Input
                    id="zoneName"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="Ej: Zona Norte"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddZone} disabled={isAddingZone}>
                  {isAddingZone ? (
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zonas Geográficas</CardTitle>
          <CardDescription>Administra las zonas geográficas para distribuidores y equipos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar zonas por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredZones.length === 0
                  ? `No se encontraron zonas que coincidan con "${searchTerm}"`
                  : `Mostrando ${filteredZones.length} zona${filteredZones.length !== 1 ? "s" : ""} de ${zones.length}`}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={filteredZones.length > 0 && selectedZones.length === filteredZones.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </div>
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredZones.length > 0 ? (
                  filteredZones.map((zone) => (
                    <TableRow key={zone.id} className={selectedZones.includes(zone.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedZones.includes(zone.id)}
                            onChange={() => toggleZoneSelection(zone.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingZone?.id === zone.id ? (
                          <Input
                            value={editingZone.name}
                            onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                          />
                        ) : (
                          zone.name
                        )}
                      </TableCell>
                      <TableCell>{new Date(zone.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {editingZone?.id === zone.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleUpdateZone}
                              className="text-green-500 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                              <span className="sr-only">Guardar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingZone(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setEditingZone(zone)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteZone(zone.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : searchTerm ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No se encontraron zonas que coincidan con "{searchTerm}".
                      <Button variant="link" onClick={clearSearch} className="ml-2">
                        Limpiar búsqueda
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No hay zonas registradas. Crea una nueva zona para comenzar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
