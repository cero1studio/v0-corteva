"use client"

import type React from "react"

import { useState, useEffect } from "react" // Import useEffect
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { registerCompetitorClient } from "@/app/actions/competitor-clients"

interface Zone {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  zone_id: string
}

interface User {
  id: string
  full_name: string
  team_id: string
  role: string
}

interface ClientFormProps {
  open: boolean
  setOpen: (open: boolean) => void
  zones: Zone[]
  teams: Team[]
  users: User[]
  onSuccess?: () => void
}

export function ClientForm({ open, setOpen, zones, teams, users, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<string>("")

  const [formData, setFormData] = useState({
    client_name: "",
    competitor_name: "",
    ganadero_name: "",
    razon_social: "",
    tipo_venta: "",
    nombre_almacen: "",
    ubicacion_finca: "",
    area_finca_hectareas: "",
    producto_anterior: "",
    producto_super_ganaderia: "",
    volumen_venta_estimado: "",
    points: "5", // Valor por defecto
    contact_info: "",
    notes: "",
  })

  const capitanes = users.filter((user) => user.role === "Capitan") // Corregido: "Capitan" con 'C' mayúscula
  const filteredTeams = selectedZone ? teams.filter((team) => team.zone_id === selectedZone) : teams
  const teamCaptain = selectedTeam ? capitanes.find((cap) => cap.team_id === selectedTeam) : null

  // Efecto para resetear el equipo si la zona seleccionada cambia y el equipo ya no es válido
  useEffect(() => {
    if (selectedZone && selectedTeam) {
      const currentTeamInFiltered = filteredTeams.some((team) => team.id === selectedTeam)
      if (!currentTeamInFiltered) {
        setSelectedTeam("") // Resetea el equipo si no pertenece a la nueva zona
      }
    }
  }, [selectedZone, filteredTeams, selectedTeam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.client_name || !selectedTeam || !teamCaptain) {
      toast({
        title: "Error",
        description:
          "Por favor completa los campos requeridos (Nombre Cliente, Equipo, y asegúrate que el equipo tenga un Capitán).",
        variant: "destructive",
      })
      return
    }

    // Validar que se ingrese nombre de almacén si el tipo de venta es por almacén
    if (formData.tipo_venta === "distribuidor" && !formData.nombre_almacen) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del almacén",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        // Solo incluir nombre_almacen si el tipo de venta es por almacén
        if (key === "nombre_almacen" && formData.tipo_venta !== "distribuidor") {
          return
        }
        form.append(key, value)
      })
      form.append("team_id", selectedTeam)
      form.append("representative", teamCaptain.id) // teamCaptain ahora está garantizado por la validación

      const result = await registerCompetitorClient(form)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Cliente registrado correctamente",
        })
        setFormData({
          client_name: "",
          competitor_name: "",
          ganadero_name: "",
          razon_social: "",
          tipo_venta: "",
          nombre_almacen: "",
          ubicacion_finca: "",
          area_finca_hectareas: "",
          producto_anterior: "",
          producto_super_ganaderia: "",
          volumen_venta_estimado: "",
          points: "5",
          contact_info: "",
          notes: "",
        })
        setSelectedZone("")
        setSelectedTeam("")
        setOpen(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al registrar cliente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating client:", error)
      toast({
        title: "Error",
        description: "Error al registrar cliente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
          <DialogDescription>Registra un nuevo cliente captado de la competencia</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selección de Zona y Equipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="zone">Zona *</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Seleccionar zona</SelectItem> {/* Opción por defecto */}
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="team">Equipo *</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Seleccionar equipo</SelectItem> {/* Opción por defecto */}
                  {filteredTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {teamCaptain && (
              <div className="md:col-span-2">
                <Label>Capitán del Equipo</Label>
                <div className="p-2 bg-background rounded border">
                  <span className="font-medium">{teamCaptain.full_name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Cliente</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Nombre del Cliente *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ganadero_name">Nombre del Ganadero</Label>
                <Input
                  id="ganadero_name"
                  value={formData.ganadero_name}
                  onChange={(e) => setFormData({ ...formData, ganadero_name: e.target.value })}
                  placeholder="Nombre del ganadero"
                />
              </div>

              <div>
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  placeholder="Razón social"
                />
              </div>

              <div>
                <Label htmlFor="competitor_name">Cliente en Competidora</Label>
                <Input
                  id="competitor_name"
                  value={formData.competitor_name}
                  onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
                  placeholder="Nombre en empresa competidora"
                />
              </div>

              <div>
                <Label htmlFor="contact_info">Celular del Ganadero</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="Número de celular del ganadero"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ubicacion_finca">Ubicación de la Finca</Label>
              <Textarea
                id="ubicacion_finca"
                value={formData.ubicacion_finca}
                onChange={(e) => setFormData({ ...formData, ubicacion_finca: e.target.value })}
                placeholder="Dirección o ubicación de la finca"
                rows={2}
              />
            </div>
          </div>

          {/* Información de Venta */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información de Venta</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_venta">Tipo de Venta</Label>
                <Select
                  value={formData.tipo_venta}
                  onValueChange={(value) => setFormData({ ...formData, tipo_venta: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de venta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="directa">Venta Directa</SelectItem>
                    <SelectItem value="distribuidor">A través de Distribuidor</SelectItem>
                    <SelectItem value="credito">Venta a Crédito</SelectItem>
                    <SelectItem value="contado">Venta de Contado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo_venta === "distribuidor" && (
                <div>
                  <Label htmlFor="nombre_almacen">Nombre del Almacén *</Label>
                  <Input
                    id="nombre_almacen"
                    value={formData.nombre_almacen}
                    onChange={(e) => setFormData({ ...formData, nombre_almacen: e.target.value })}
                    placeholder="Nombre del almacén"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="volumen_venta_estimado">Volumen de Venta Estimado</Label>
                <Input
                  id="volumen_venta_estimado"
                  value={formData.volumen_venta_estimado}
                  onChange={(e) => setFormData({ ...formData, volumen_venta_estimado: e.target.value })}
                  placeholder="Ej: 50 bultos, 2 toneladas"
                />
              </div>

              <div>
                <Label htmlFor="area_finca_hectareas">Área de Finca (Hectáreas)</Label>
                <Input
                  id="area_finca_hectareas"
                  type="number"
                  step="0.01"
                  value={formData.area_finca_hectareas}
                  onChange={(e) => setFormData({ ...formData, area_finca_hectareas: e.target.value })}
                  placeholder="Área en hectáreas"
                />
              </div>

              <div>
                <Label htmlFor="points">Puntos Asignados</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="Puntos asignados"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Cualquier nota relevante sobre el cliente"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedTeam || !teamCaptain}>
              {loading ? "Registrando..." : "Registrar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
