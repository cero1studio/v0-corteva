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
import { GoalCelebration } from "@/components/goal-celebration"

export default function RegistrarClientePage() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [previousSupplier, setPreviousSupplier] = useState("")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !previousSupplier || !userId) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
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
          name,
          previous_supplier: previousSupplier,
          contact_info: contactInfo,
          notes,
          captured_by: userId,
          team_id: profile.team_id,
          capture_date: new Date().toISOString().split("T")[0],
        })
        .select()

      if (error) throw new Error(`Error al registrar cliente: ${error.message}`)

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
      description: "El cliente ha sido registrado correctamente",
    })

    // Limpiar formulario
    setName("")
    setPreviousSupplier("")
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
          <CardDescription>Registra un nuevo cliente captado de la competencia</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Cliente *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousSupplier">Proveedor Anterior *</Label>
              <Input
                id="previousSupplier"
                value={previousSupplier}
                onChange={(e) => setPreviousSupplier(e.target.value)}
                required
              />
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
              {loading ? "Registrando..." : "Registrar Cliente"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <GoalCelebration
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        goalCount={10}
        productName="Cliente Captado"
      />
    </div>
  )
}
