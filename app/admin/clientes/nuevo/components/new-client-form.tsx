"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { registerCompetitorClient } from "@/app/actions/competitor-clients"
import { toast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatColombianMobile, getPhoneValidationError, PHONE_INPUT_PROPS } from "@/lib/phone-validation"

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
  full_name: string | null
  team_id: string | null
  role: string
}

interface NewClientFormProps {
  zones: Zone[]
  teams: Team[]
  captains: User[]
}

export function NewClientForm({ zones, teams, captains }: NewClientFormProps) {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedZoneId, setSelectedZoneId] = useState<string>("")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [tipoVenta, setTipoVenta] = useState<string>("")
  const [nombreAlmacen, setNombreAlmacen] = useState<string>("")
  const [contactInfo, setContactInfo] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Filter teams based on selected zone
  const availableTeams = selectedZoneId ? teams.filter((team) => team.zone_id === selectedZoneId) : teams

  // Find the captain for the selected team
  const selectedTeam = teams.find((team) => team.id === selectedTeamId)
  const teamCaptain = selectedTeamId
    ? captains.find((user) => user.role === "capitan" && user.team_id === selectedTeamId)
    : null

  // Reset selected team if the zone changes and the current team is no longer valid
  useEffect(() => {
    if (selectedTeamId && !availableTeams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId("")
    }
  }, [selectedZoneId, availableTeams, selectedTeamId])

  // Handle phone input change with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers, spaces, hyphens, parentheses, and plus sign
    const cleanValue = value.replace(/[^\d\s\-$$$$+]/g, "")
    setContactInfo(cleanValue)

    // Clear phone error when user starts typing
    if (formErrors.contact_info) {
      setFormErrors((prev) => ({ ...prev, contact_info: "" }))
    }
  }

  const handleSubmit = async (formData: FormData) => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    // Obtener todos los valores del formulario
    const client_name = formData.get("client_name") as string
    const ganadero_name = formData.get("ganadero_name") as string
    const razon_social = formData.get("razon_social") as string
    const competitor_name = formData.get("competitor_name") as string
    const ubicacion_finca = formData.get("ubicacion_finca") as string
    const volumen_venta_real = formData.get("volumen_venta_real") as string
    const area_finca_hectareas_str = formData.get("area_finca_hectareas") as string
    const producto_anterior = formData.get("producto_anterior") as string
    const producto_super_ganaderia = formData.get("producto_super_ganaderia") as string
    const points_str = formData.get("points") as string
    const notes = formData.get("notes") as string

    // Validaciones obligatorias
    if (!client_name?.trim()) {
      newErrors.client_name = "El nombre del cliente es requerido."
      isValid = false
    }
    if (!ganadero_name?.trim()) {
      newErrors.ganadero_name = "El nombre del ganadero es requerido."
      isValid = false
    }
    if (!razon_social?.trim()) {
      newErrors.razon_social = "La razón social es requerida."
      isValid = false
    }
    if (!competitor_name?.trim()) {
      newErrors.competitor_name = "El nombre en empresa competidora es requerido."
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
    if (!ubicacion_finca?.trim()) {
      newErrors.ubicacion_finca = "La ubicación de la finca es requerida."
      isValid = false
    }
    if (!tipoVenta) {
      newErrors.tipo_venta = "El tipo de venta es requerido."
      isValid = false
    }
    // Validación condicional para almacén
    if (tipoVenta === "distribuidor" && !nombreAlmacen.trim()) {
      newErrors.nombre_almacen = "El nombre del almacén es requerido para este tipo de venta."
      isValid = false
    }
    if (!volumen_venta_real?.trim()) {
      newErrors.volumen_venta_real = "El volumen de venta real es requerido."
      isValid = false
    }
    if (!area_finca_hectareas_str?.trim()) {
      newErrors.area_finca_hectareas = "El área de la finca es requerida."
      isValid = false
    } else if (isNaN(Number(area_finca_hectareas_str))) {
      newErrors.area_finca_hectareas = "El área de la finca debe ser un número válido."
      isValid = false
    }
    if (!producto_anterior?.trim()) {
      newErrors.producto_anterior = "El producto anterior es requerido."
      isValid = false
    }
    if (!producto_super_ganaderia?.trim()) {
      newErrors.producto_super_ganaderia = "El producto de Súper Ganadería es requerido."
      isValid = false
    }
    if (!contactInfo?.trim()) {
      newErrors.contact_info = "El celular del ganadero es requerido."
      isValid = false
    }
    if (!points_str?.trim()) {
      newErrors.points = "Los puntos asignados son requeridos."
      isValid = false
    } else if (isNaN(Number(points_str))) {
      newErrors.points = "Los puntos deben ser un número válido."
      isValid = false
    }
    if (!notes?.trim()) {
      newErrors.notes = "Las notas adicionales son requeridas."
      isValid = false
    }

    // Phone validation
    const phoneError = getPhoneValidationError(contactInfo)
    if (phoneError) {
      newErrors.contact_info = phoneError
      isValid = false
    }

    setFormErrors(newErrors)

    if (!isValid) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Format phone number before sending
    const formattedPhone = formatColombianMobile(contactInfo)
    formData.set("contact_info", formattedPhone)

    // Append additional data to formData for the server action
    formData.append("team_id", selectedTeamId)
    formData.append("representative_id", teamCaptain!.id) // teamCaptain is guaranteed to exist here due to validation
    formData.append("tipo_venta", tipoVenta)
    formData.append("nombre_almacen", tipoVenta === "distribuidor" ? nombreAlmacen : "")

    try {
      const result = await registerCompetitorClient(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Cliente registrado correctamente",
        })
        router.push("/admin/clientes")
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al registrar cliente",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error inesperado al registrar cliente",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/clientes">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver a clientes</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrar Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Completa todos los detalles para agregar un nuevo cliente de la competencia.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>Todos los campos son obligatorios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {/* Selección de Zona y Equipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="zone">Zona *</Label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
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
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
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
                  <Input id="client_name" name="client_name" placeholder="Nombre del cliente" required />
                  {formErrors.client_name && <p className="text-red-500 text-sm mt-1">{formErrors.client_name}</p>}
                </div>

                <div>
                  <Label htmlFor="ganadero_name">Nombre del Ganadero *</Label>
                  <Input id="ganadero_name" name="ganadero_name" placeholder="Nombre del ganadero" required />
                  {formErrors.ganadero_name && <p className="text-red-500 text-sm mt-1">{formErrors.ganadero_name}</p>}
                </div>

                <div>
                  <Label htmlFor="razon_social">Razón Social *</Label>
                  <Input id="razon_social" name="razon_social" placeholder="Razón social" required />
                  {formErrors.razon_social && <p className="text-red-500 text-sm mt-1">{formErrors.razon_social}</p>}
                </div>

                <div>
                  <Label htmlFor="competitor_name">Cliente en Competidora *</Label>
                  <Input
                    id="competitor_name"
                    name="competitor_name"
                    placeholder="Nombre en empresa competidora"
                    required
                  />
                  {formErrors.competitor_name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.competitor_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contact_info">Celular del Ganadero *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="contact_info"
                      name="contact_info"
                      value={contactInfo}
                      onChange={handlePhoneChange}
                      className={`pl-10 ${formErrors.contact_info ? "border-red-500" : ""}`}
                      required
                      {...PHONE_INPUT_PROPS}
                    />
                  </div>
                  {formErrors.contact_info && <p className="text-red-500 text-sm mt-1">{formErrors.contact_info}</p>}
                  <p className="text-xs text-gray-500 mt-1">Ejemplo: 3205812587 (número colombiano de 10 dígitos)</p>
                </div>
              </div>

              <div>
                <Label htmlFor="ubicacion_finca">Ubicación de la Finca *</Label>
                <Textarea
                  id="ubicacion_finca"
                  name="ubicacion_finca"
                  placeholder="Dirección o ubicación de la finca"
                  rows={2}
                  required
                />
                {formErrors.ubicacion_finca && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.ubicacion_finca}</p>
                )}
              </div>
            </div>

            {/* Información de Venta */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información de Venta</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_venta">Tipo de Venta *</Label>
                  <Select value={tipoVenta} onValueChange={setTipoVenta}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de venta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta_directa">Venta Directa</SelectItem>
                      <SelectItem value="distribuidor">A través de Distribuidor</SelectItem>
                      <SelectItem value="venta_credito">Venta a Crédito</SelectItem>
                      <SelectItem value="venta_contado">Venta de Contado</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.tipo_venta && <p className="text-red-500 text-sm mt-1">{formErrors.tipo_venta}</p>}
                </div>

                {tipoVenta === "distribuidor" && (
                  <div>
                    <Label htmlFor="nombre_almacen">Nombre del Almacén *</Label>
                    <Input
                      id="nombre_almacen"
                      name="nombre_almacen"
                      value={nombreAlmacen}
                      onChange={(e) => setNombreAlmacen(e.target.value)}
                      placeholder="Nombre del almacén"
                      required
                    />
                    {formErrors.nombre_almacen && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.nombre_almacen}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="volumen_venta_real">Volumen de Venta Real *</Label>
                  <Input
                    id="volumen_venta_real"
                    name="volumen_venta_real"
                    placeholder="Ej: 50 bultos, 2 toneladas"
                    required
                  />
                  {formErrors.volumen_venta_real && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.volumen_venta_real}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="area_finca_hectareas">Área de Finca (Hectáreas) *</Label>
                  <Input
                    id="area_finca_hectareas"
                    name="area_finca_hectareas"
                    type="number"
                    step="0.01"
                    placeholder="Área en hectáreas"
                    required
                  />
                  {formErrors.area_finca_hectareas && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.area_finca_hectareas}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="points">Puntos Asignados *</Label>
                  <Input
                    id="points"
                    name="points"
                    type="number"
                    defaultValue="5" // Default value as per schema
                    placeholder="Puntos asignados"
                    required
                  />
                  {formErrors.points && <p className="text-red-500 text-sm mt-1">{formErrors.points}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="producto_anterior">Producto Anterior *</Label>
                  <Input
                    id="producto_anterior"
                    name="producto_anterior"
                    placeholder="Producto que usaba anteriormente"
                    required
                  />
                  {formErrors.producto_anterior && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.producto_anterior}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="producto_super_ganaderia">Producto Súper Ganadería *</Label>
                  <Select name="producto_super_ganaderia">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Combatran XT">Combatran XT</SelectItem>
                      <SelectItem value="Pastar D">Pastar D</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.producto_super_ganaderia && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.producto_super_ganaderia}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales *</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Cualquier nota relevante sobre el cliente"
                rows={3}
                required
              />
              {formErrors.notes && <p className="text-red-500 text-sm mt-1">{formErrors.notes}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/clientes">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar Cliente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
