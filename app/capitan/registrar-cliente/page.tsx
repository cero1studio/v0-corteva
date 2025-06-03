"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { ClientGoalCelebration } from "@/components/client-goal-celebration"

export default function RegistrarClientePage() {
  const [loading, setLoading] = useState(false)
  const [farmerName, setFarmerName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [saleType, setSaleType] = useState("")
  const [storeName, setStoreName] = useState("")
  const [farmLocation, setFarmLocation] = useState("")
  const [farmAreaHectares, setFarmAreaHectares] = useState("")
  const [previousProduct, setPreviousProduct] = useState("")
  const [superGanaderiaProduct, setSuperGanaderiaProduct] = useState("")
  const [volumenFacturado, setVolumenFacturado] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [notes, setNotes] = useState("")
  const [userId, setUserId] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUser() {
      try {
        // Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del usuario",
          variant: "destructive",
        })
      }
    }

    fetchUser()
  }, [toast])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo permitir números
    if (value === "" || /^\d+$/.test(value)) {
      setVolumenFacturado(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !farmerName ||
      !saleType ||
      !farmLocation ||
      !previousProduct ||
      !superGanaderiaProduct ||
      !volumenFacturado ||
      !userId
    ) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive",
      })
      return
    }

    // Validar que se ingrese nombre de almacén si el tipo de venta es por almacén
    if (saleType === "Venta por Almacén" && !storeName) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del almacén",
        variant: "destructive",
      })
      return
    }

    // Validar volumen mínimo
    const volumen = Number.parseInt(volumenFacturado)
    if (volumen < 100) {
      toast({
        title: "Error",
        description: "El volumen de venta facturado debe ser mínimo 100 litros",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Obtener información del usuario y equipo
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", userId)
        .single()

      if (profileError) throw new Error(`Error al obtener perfil: ${profileError.message}`)
      if (!profile || !profile.team_id) throw new Error("Usuario sin equipo asignado")

      // Registrar el cliente
      const { data, error } = await supabase
        .from("competitor_clients")
        .insert({
          client_name: farmerName,
          competitor_name: farmerName,
          ganadero_name: farmerName,
          razon_social: businessName,
          tipo_venta: saleType,
          nombre_almacen: saleType === "Venta por Almacén" ? storeName : null,
          ubicacion_finca: farmLocation,
          area_finca_hectareas: farmAreaHectares ? Number.parseFloat(farmAreaHectares) : null,
          producto_anterior: previousProduct,
          producto_super_ganaderia: superGanaderiaProduct,
          volumen_venta_estimado: volumen,
          contact_info: contactInfo,
          notes,
          representative_id: userId,
          team_id: profile.team_id,
          points: 200, // Cada cliente = 200 puntos (2 goles)
        })
        .select()

      if (error) throw new Error(`Error al registrar cliente: ${error.message}`)

      // Obtener la configuración de puntos para un gol
      const { data: puntosConfig, error: puntosError } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "puntos_para_gol")
        .maybeSingle()

      // Por defecto 100 puntos = 1 gol si no hay configuración
      const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

      // Cada cliente suma 2 goles (200 puntos)
      const golesCliente = 2
      const puntosCliente = golesCliente * puntosParaGol // 200 puntos

      // Obtener puntos actuales del equipo
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("total_points, goals")
        .eq("id", profile.team_id)
        .single()

      if (teamError) throw new Error(`Error al obtener datos del equipo: ${teamError.message}`)

      // Sumar los puntos del cliente a los puntos actuales del equipo
      const newTotalPoints = (teamData?.total_points || 0) + puntosCliente
      const newTotalGoals = Math.floor(newTotalPoints / puntosParaGol)

      // Actualizar el equipo con los nuevos puntos y goles
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          total_points: newTotalPoints,
          goals: newTotalGoals,
        })
        .eq("id", profile.team_id)

      if (updateError) throw new Error(`Error al actualizar equipo: ${updateError.message}`)

      // Mostrar celebración
      setShowCelebration(true)
    } catch (error: any) {
      console.error("Error al registrar cliente:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCelebrationClose = () => {
    setShowCelebration(false)
    toast({
      title: "Cliente registrado",
      description: "El cliente ha sido registrado correctamente (+2 goles)",
    })

    // Limpiar formulario
    setFarmerName("")
    setBusinessName("")
    setSaleType("")
    setStoreName("")
    setFarmLocation("")
    setFarmAreaHectares("")
    setPreviousProduct("")
    setSuperGanaderiaProduct("")
    setVolumenFacturado("")
    setContactInfo("")
    setNotes("")

    // Redirigir al dashboard
    router.push("/capitan/dashboard")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center">
        <Button variant="outline" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Registrar Cliente de la Competencia</h1>
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nuevo Cliente
          </CardTitle>
          <CardDescription>Registra un nuevo cliente captado de la competencia (+2 goles)</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmerName">Nombre del Ganadero *</Label>
              <Input
                id="farmerName"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Nombre completo del cliente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Razón Social</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nombre legal de la empresa, si aplica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleType">Tipo de Venta *</Label>
              <select
                id="saleType"
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar una opción</option>
                <option value="Venta Directa">Venta Directa</option>
                <option value="Venta por Almacén">Venta por Almacén</option>
              </select>
            </div>

            {saleType === "Venta por Almacén" && (
              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre del Almacén *</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nombre del almacén"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="farmLocation">Ubicación de la Finca del ganadero *</Label>
              <Input
                id="farmLocation"
                value={farmLocation}
                onChange={(e) => setFarmLocation(e.target.value)}
                placeholder="Departamento, municipio o vereda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmAreaHectares">Área de la Finca (hectáreas)</Label>
              <Input
                id="farmAreaHectares"
                type="number"
                step="0.1"
                value={farmAreaHectares}
                onChange={(e) => setFarmAreaHectares(e.target.value)}
                placeholder="Número de hectáreas dedicadas a la actividad ganadera"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousProduct">Producto que Usaba Anteriormente *</Label>
              <Input
                id="previousProduct"
                value={previousProduct}
                onChange={(e) => setPreviousProduct(e.target.value)}
                placeholder="Nombre del producto de la competencia que utilizaba"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="superGanaderiaProduct">Producto de Super Ganadería al que Migró *</Label>
              <select
                id="superGanaderiaProduct"
                value={superGanaderiaProduct}
                onChange={(e) => setSuperGanaderiaProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar una opción</option>
                <option value="Combatran XT">Combatran XT</option>
                <option value="Pastar D">Pastar D</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volumenFacturado">Volumen de Venta Facturado (litros) *</Label>
              <Input
                id="volumenFacturado"
                type="number"
                min="100"
                value={volumenFacturado}
                onChange={handleVolumeChange}
                placeholder="Mínimo 100 litros"
                required
              />
              {volumenFacturado && Number.parseInt(volumenFacturado) < 100 && (
                <p className="text-sm text-red-500">El volumen debe ser mínimo 100 litros</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Información de Contacto</Label>
              <Input
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Teléfono, email, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles adicionales sobre el cliente"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Cliente (+2 goles)"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <ClientGoalCelebration
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        goalCount={2}
        clientName={farmerName}
      />
    </div>
  )
}
