"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  const [errors, setErrors] = useState<Record<string, string>>({}) // Nuevo estado para errores de validación

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

  const capitanes = users.filter((user) => user.role === "Capitan") // Asegúrate que el casing sea correcto
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => ({ ...prev, [id]: "" })) // Limpiar error al cambiar el campo
  }

  const handleSelectChange = (id: string, value: string) => {
    if (id === "zone") {
      setSelectedZone(value)
      setSelectedTeam("") // Resetear equipo al cambiar la zona
    } else if (id === "team") {
      setSelectedTeam(value)
    } else if (id === "tipo_venta") {
      setFormData((prev) => ({ ...prev, tipo_venta: value }))
      if (value !== "distribuidor") {
        setFormData((prev) => ({ ...prev, nombre_almacen: "" })) // Limpiar nombre_almacen si no es distribuidor
      }
    }
    setErrors((prev) => ({ ...prev, [id]: "" })) // Limpiar error al cambiar el select
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!formData.client_name.trim()) {
      newErrors.client_name = "El nombre del cliente es requerido."
      isValid = false
    }
    if (!selectedZone || selectedZone === "default") {
      newErrors.zone = "La zona es requerida."
      isValid = false
    }
    if (!selectedTeam || selectedTeam === "default") {
      newErrors.team = "El equipo es requerido."
      isValid = false
    }
    if (selectedTeam && !teamCaptain) {
      newErrors.team = "El equipo seleccionado no tiene un Capitán asignado."
      isValid = false
    }
    if (formData.tipo_venta === "distribuidor" && !formData.nombre_almacen.trim()) {
      newErrors.nombre_almacen = "El nombre del almacén es requerido para este tipo de venta."
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "nombre_almacen" && formData.tipo_venta !== "distribuidor") {
          return // No añadir si no es relevante
        }
        form.append(key, value)
      })
      form.append("team_id", selectedTeam)
      form.append("representative", teamCaptain!.id) // teamCaptain está garantizado por la validación

      const result = await registerCompetitorClient(form)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Cliente registrado correctamente",
        })
        // Resetear el formulario
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
        setErrors({}) // Limpiar todos los errores
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
              <Select value={selectedZone} onValueChange={(value) => handleSelectChange("zone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" disabled>
                    Seleccionar zona
                  </SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zone && <p className="text-red-500 text-sm mt-1">{errors.zone}</p>}
            </div>

            <div>
              <Label htmlFor="team">Equipo *</Label>
              <Select value={selectedTeam} onValueChange={(value) => handleSelectChange("team", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" disabled>
                    Seleccionar equipo
                  </SelectItem>
                  {filteredTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team && <p className="text-red-500 text-sm mt-1">{errors.team}</p>}
            </div>

            {selectedTeam && teamCaptain && (
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
                  onChange={handleChange}
                  placeholder="Nombre del cliente"
                  required
                />
                {errors.client_name && <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>}
              </div>

              <div>
                <Label htmlFor="ganadero_name">Nombre del Ganadero</Label>
                <Input
                  id="ganadero_name"
                  value={formData.ganadero_name}
                  onChange={handleChange}
                  placeholder="Nombre del ganadero"
                />
              </div>

              <div>
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={handleChange}
                  placeholder="Razón social"
                />
              </div>

              <div>
                <Label htmlFor="competitor_name">Cliente en Competidora</Label>
                <Input
                  id="competitor_name"
                  value={formData.competitor_name}
                  onChange={handleChange}
                  placeholder="Nombre en empresa competidora"
                />
              </div>

              <div>
                <Label htmlFor="contact_info">Celular del Ganadero</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={handleChange}
                  placeholder="Número de celular del ganadero"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ubicacion_finca">Ubicación de la Finca</Label>
              <Textarea
                id="ubicacion_finca"
                value={formData.ubicacion_finca}
                onChange={handleChange}
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
                <Select value={formData.tipo_venta} onValueChange={(value) => handleSelectChange("tipo_venta", value)}>
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
                    onChange={handleChange}
                    placeholder="Nombre del almacén"
                    required
                  />
                  {errors.nombre_almacen && <p className="text-red-500 text-sm mt-1">{errors.nombre_almacen}</p>}
                </div>
              )}

              <div>
                <Label htmlFor="volumen_venta_estimado">Volumen de Venta Estimado</Label>
                <Input
                  id="volumen_venta_estimado"
                  value={formData.volumen_venta_estimado}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  placeholder="Área en hectáreas"
                />
              </div>

              <div>
                <Label htmlFor="points">Puntos Asignados</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={handleChange}
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
              onChange={handleChange}
              placeholder="Cualquier nota relevante sobre el cliente"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
