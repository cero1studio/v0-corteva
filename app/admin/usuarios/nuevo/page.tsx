"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUser } from "@/app/actions/users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface Zone {
  id: string
  name: string
}

interface Distributor {
  id: string
  name: string
}

const roles = {
  admin: "Administrador",
  capitan: "Capitán",
  director_tecnico: "Director Técnico",
  representante: "Representante",
  supervisor: "Supervisor",
}

export default function NuevoUsuarioPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [role, setRole] = useState("")
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [selectedZone, setSelectedZone] = useState("")
  const [selectedDistributor, setSelectedDistributor] = useState("")
  const [loadingZones, setLoadingZones] = useState(false)
  const [loadingDistributors, setLoadingDistributors] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchZones()
    fetchDistributors()
  }, [])

  async function fetchZones() {
    try {
      setLoadingZones(true)
      const { data, error } = await supabase.from("zones").select("id, name").order("name")

      if (error) throw error
      setZones(data || [])
    } catch (error) {
      console.error("Error al cargar zonas:", error)
    } finally {
      setLoadingZones(false)
    }
  }

  async function fetchDistributors() {
    try {
      setLoadingDistributors(true)
      const { data, error } = await supabase.from("distributors").select("id, name").order("name")

      if (error) throw error
      setDistributors(data || [])
    } catch (error) {
      console.error("Error al cargar distribuidores:", error)
    } finally {
      setLoadingDistributors(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      // Combinar nombre y apellido en fullName
      const name = formData.get("name") as string
      const surname = formData.get("surname") as string
      const fullName = `${name} ${surname}`.trim()

      // Crear nuevo FormData con los campos correctos
      const submitData = new FormData()
      submitData.append("email", formData.get("email") as string)
      submitData.append("password", formData.get("password") as string)
      submitData.append("fullName", fullName)
      submitData.append("role", role)

      // Solo agregar zona y distribuidor si el rol los requiere
      if (role === "capitan" || role === "director_tecnico") {
        if (selectedZone) {
          submitData.append("zoneId", selectedZone)
        }
        if (selectedDistributor) {
          submitData.append("distributorId", selectedDistributor)
        }
      }

      const result = await createUser(submitData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado exitosamente",
        })
        router.push("/admin/usuarios")
      }
    } catch (error: any) {
      console.error("Error al crear usuario:", error)
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Usuario</CardTitle>
          <CardDescription>Ingresa los datos del nuevo usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" name="name" placeholder="Nombre" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Apellido *</Label>
                  <Input id="surname" name="surname" placeholder="Apellido" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <Select value={role} onValueChange={(value) => setRole(value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roles).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(role === "capitan" || role === "director_tecnico") && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="zoneId">Zona</Label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingZones ? "Cargando..." : "Selecciona una zona"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_zona">Sin zona</SelectItem>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distributorId">Distribuidor</Label>
                    <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingDistributors ? "Cargando..." : "Selecciona un distribuidor"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_distribuidor">Sin distribuidor</SelectItem>
                        {distributors.map((distributor) => (
                          <SelectItem key={distributor.id} value={distributor.id}>
                            {distributor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {role === "admin" && (
                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-500">
                  Los administradores no necesitan zona o distribuidor asignado.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/usuarios")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !role}>
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
