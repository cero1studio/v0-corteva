"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Users, Phone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { ClientGoalCelebration } from "@/components/client-goal-celebration"
import { registerCapitanCompetitorClient } from "@/app/actions/clients"
import { getPhoneValidationError, PHONE_INPUT_PROPS } from "@/lib/phone-validation"

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
  const [showCelebration, setShowCelebration] = useState(false)
  const [phoneError, setPhoneError] = useState<string>("")

  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status: sessionStatus } = useSession()

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo permitir números
    if (value === "" || /^\d+$/.test(value)) {
      setVolumenFacturado(value)
    }
  }

  // Handle phone input change with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers, spaces, hyphens, parentheses, and plus sign
    const cleanValue = value.replace(/[^\d\s\-$$$$+]/g, "")
    setContactInfo(cleanValue)

    // Clear phone error when user starts typing
    if (phoneError) {
      setPhoneError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar todos los campos obligatorios
    if (
      !farmerName.trim() ||
      !businessName.trim() ||
      !saleType ||
      !farmLocation.trim() ||
      !farmAreaHectares.trim() ||
      !previousProduct.trim() ||
      !superGanaderiaProduct ||
      !volumenFacturado ||
      !contactInfo.trim() ||
      !notes.trim() ||
      sessionStatus !== "authenticated" ||
      !session?.user?.id
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validar que se ingrese nombre de almacén si el tipo de venta es por almacén
    if (saleType === "Venta por Almacén" && !storeName.trim()) {
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

    // Validar área de finca
    const areaFinca = Number.parseFloat(farmAreaHectares)
    if (isNaN(areaFinca) || areaFinca <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un área de finca válida",
        variant: "destructive",
      })
      return
    }

    // Validar teléfono
    const phoneValidationError = getPhoneValidationError(contactInfo)
    if (phoneValidationError) {
      setPhoneError(phoneValidationError)
      toast({
        title: "Error",
        description: phoneValidationError,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await registerCapitanCompetitorClient({
        farmerName: farmerName.trim(),
        businessName: businessName.trim(),
        saleType,
        storeName: saleType === "Venta por Almacén" ? storeName.trim() : null,
        farmLocation: farmLocation.trim(),
        farmAreaHectares: areaFinca,
        previousProduct: previousProduct.trim(),
        superGanaderiaProduct,
        volumenFacturado: volumen,
        contactInfo,
        notes: notes.trim(),
      })

      if (!result.success) {
        throw new Error(result.error)
      }

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

    // Limpiar formulario y resetear estados
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
    setPhoneError("")
    setLoading(false) // Asegurar que loading esté en false

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
          <CardDescription>
            Registra un nuevo cliente captado de la competencia (+2 goles). Todos los campos son obligatorios.
          </CardDescription>
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
              <Label htmlFor="businessName">Razón Social *</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nombre legal de la empresa"
                required
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
              <Label htmlFor="farmAreaHectares">Área de la Finca (hectáreas) *</Label>
              <Input
                id="farmAreaHectares"
                type="number"
                step="0.1"
                value={farmAreaHectares}
                onChange={(e) => setFarmAreaHectares(e.target.value)}
                placeholder="Número de hectáreas dedicadas a la actividad ganadera"
                required
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
              <Label htmlFor="volumenFacturado">Volumen de Venta Real (litros) *</Label>
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
              <Label htmlFor="contactInfo">Celular del Ganadero *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="contactInfo"
                  value={contactInfo}
                  onChange={handlePhoneChange}
                  className={`pl-10 ${phoneError ? "border-red-500" : ""}`}
                  required
                  {...PHONE_INPUT_PROPS}
                />
              </div>
              {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
              <p className="text-xs text-gray-500 mt-1">Ejemplo: 3205812587 (número colombiano de 10 dígitos)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas *</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles adicionales sobre el cliente"
                rows={3}
                required
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
