"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2, Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Zone {
  id: string
  name: string
  created_at: string
}

export default function ZonasPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [newZoneName, setNewZoneName] = useState("")
  const [isAddingZone, setIsAddingZone] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchZones()
  }, [])

  async function fetchZones() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("zones").select("*").order("name")

      if (error) throw error

      setZones(data || [])
    } catch (error) {
      console.error("Error al cargar zonas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
      const { data, error } = await supabase.from("zones").insert({ name: newZoneName.trim() }).select()

      if (error) throw error

      setZones([...zones, data[0]])
      setNewZoneName("")
      toast({
        title: "Zona añadida",
        description: "La zona ha sido añadida exitosamente",
      })
    } catch (error) {
      console.error("Error al añadir zona:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir la zona",
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
      const { error } = await supabase.from("zones").update({ name: editingZone.name.trim() }).eq("id", editingZone.id)

      if (error) throw error

      setZones(zones.map((zone) => (zone.id === editingZone.id ? editingZone : zone)))

      toast({
        title: "Zona actualizada",
        description: "La zona ha sido actualizada exitosamente",
      })
    } catch (error) {
      console.error("Error al actualizar zona:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la zona",
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
      // Eliminar directamente sin verificar dependencias
      const { error } = await supabase.from("zones").delete().eq("id", id)

      if (error) {
        // Si hay un error, probablemente sea por restricciones de clave foránea
        toast({
          title: "Error",
          description: "No se pudo eliminar la zona. Asegúrate de que no tenga distribuidores o equipos asociados.",
          variant: "destructive",
        })
        return
      }

      setZones(zones.filter((zone) => zone.id !== id))

      toast({
        title: "Zona eliminada",
        description: "La zona ha sido eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error al eliminar zona:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona. Asegúrate de que no tenga distribuidores o equipos asociados.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Zonas</h2>
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

      <Card>
        <CardHeader>
          <CardTitle>Zonas Geográficas</CardTitle>
          <CardDescription>Administra las zonas geográficas para distribuidores y equipos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.length > 0 ? (
                  zones.map((zone) => (
                    <TableRow key={zone.id}>
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
