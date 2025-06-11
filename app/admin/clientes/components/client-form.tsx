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
  const [selectedZoneId, setSelectedZoneId] = useState<string>("")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
    points: "5", // Default value as per schema
    contact_info: "",
    notes: "",
  })

  // Filter teams based on selected zone
  const availableTeams = selectedZoneId ? teams.filter((team) => team.zone_id === selectedZoneId) : teams

  // Find the captain of the selected team
  const selectedTeam = teams.find((team) => team.id === selectedTeamId)
  const teamCaptain = selectedTeamId
    ? users.find((user) => user.role === "capitan" && user.team_id === selectedTeamId) // Ensure role matches DB
    : null

  useEffect(() => {
    // Reset team selection if the selected zone no longer contains the team
    if (selectedTeamId && !availableTeams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId("")
    }
  }, [selectedZoneId, availableTeams, selectedTeamId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setFormErrors((prev) => ({ ...prev, [id]: "" })) // Clear error on change
  }

  const handleSelectChange = (id: string, value: string) => {
    if (id === "zone") {
      setSelectedZoneId(value)
      setSelectedTeamId("") // Reset team when zone changes
      setFormErrors((prev) => ({ ...prev, zone: "", team: "" }))
    } else if (id === "team") {
      setSelectedTeamId(value)
      setFormErrors((prev) => ({ ...prev, team: "" }))
    } else if (id === "tipo_venta") {
      setFormData((prev) => ({ ...prev, tipo_venta: value }))
      if (value !== "distribuidor") {
        setFormData((prev) => ({ ...prev, nombre_almacen: "" }))
        setFormErrors((prev) => ({ ...prev, nombre_almacen: "" }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!formData.client_name.trim()) {
      newErrors.client_name = "El nombre del cliente es requerido."
      isValid = false
    }
    if (!selectedZoneId) {
      newErrors.zone = "La zona es requerida."
      isValid = false
    }
    if (!selectedTeamId) {
      newErrors.team = "El equipo es requerido."
      isValid = false
    }
    if (selectedTeamId && !teamCaptain) {
      newErrors.team = "El equipo seleccionado no tiene un Capitán asignado."
      isValid = false
    }
    if (formData.tipo_venta === "distribuidor" && !formData.nombre_almacen.trim()) {
      newErrors.nombre_almacen = "El nombre del almacén es requerido para este tipo de venta."
      isValid = false
    }
    if (formData.area_finca_hectareas && isNaN(Number(formData.area_finca_hectareas))) {
      newErrors.area_finca_hectareas = "El área de la finca debe ser un número válido."
      isValid = false
    }
    if (formData.points && isNaN(Number(formData.points))) {
      newErrors.points = "Los puntos deben ser un número válido."
      isValid = false
    }

    setFormErrors(newErrors)
    return isValid
  }

  const resetForm = () => {
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
    setSelectedZoneId("")
    setSelectedTeamId("")
    setFormErrors({})
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
          return // Skip nombre_almacen if not distributor type
        }
        form.append(key, value)
      })
      form.append("team_id", selectedTeamId)
      form.append("representative_id", teamCaptain!.id) // Use representative_id

      const result = await registerCompetitorClient(form)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Cliente registrado correctamente",
        })
        resetForm()
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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm() // Reset form on dialog close
        }
        setOpen(isOpen)
      }}
    >
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
              <Select value={selectedZoneId} onValueChange={(value) => handleSelectChange("zone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.zone && <p className="text-red-500 text-sm mt-1">{formErrors.zone}</p>}
            </div>

            <div>
              <Label htmlFor="team">Equipo *</Label>
              <Select value={selectedTeamId} onValueChange={(value) => handleSelectChange("team", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.team && <p className="text-red-500 text-sm mt-1">{formErrors.team}</p>}
            </div>

            {selectedTeamId && teamCaptain && (
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
                  onChange={handleInputChange}
                  placeholder="Nombre del cliente"
                  required
                />
                {formErrors.client_name && <p className="text-red-500 text-sm mt-1">{formErrors.client_name}</p>}
              </div>

              <div>
                <Label htmlFor="ganadero_name">Nombre del Ganadero</Label>
                <Input
                  id="ganadero_name"
                  value={formData.ganadero_name}
                  onChange={handleInputChange}
                  placeholder="Nombre del ganadero"
                />
              </div>

              <div>
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={handleInputChange}
                  placeholder="Razón social"
                />
              </div>

              <div>
                <Label htmlFor="competitor_name">Cliente en Competidora</Label>
                <Input
                  id="competitor_name"
                  value={formData.competitor_name}
                  onChange={handleInputChange}
                  placeholder="Nombre en empresa competidora"
                />
              </div>

              <div>
                <Label htmlFor="contact_info">Celular del Ganadero</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={handleInputChange}
                  placeholder="Número de celular del ganadero"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ubicacion_finca">Ubicación de la Finca</Label>
              <Textarea
                id="ubicacion_finca"
                value={formData.ubicacion_finca}
                onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    placeholder="Nombre del almacén"
                    required
                  />
                  {formErrors.nombre_almacen && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.nombre_almacen}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="volumen_venta_estimado">Volumen de Venta Estimado</Label>
                <Input
                  id="volumen_venta_estimado"
                  value={formData.volumen_venta_estimado}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  placeholder="Área en hectáreas"
                />
                {formErrors.area_finca_hectareas && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.area_finca_hectareas}</p>
                )}
              </div>

              <div>
                <Label htmlFor="points">Puntos Asignados</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={handleInputChange}
                  placeholder="Puntos asignados"
                />
                {formErrors.points && <p className="text-red-500 text-sm mt-1">{formErrors.points}</p>}
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange}
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
