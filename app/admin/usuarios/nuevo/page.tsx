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
    console.log("Componente montado, cargando datos...")
    fetchZones()
    fetchDistributors()
  }, [])

  async function fetchZones() {
    try {
      console.log("Iniciando carga de zonas...")
      setLoadingZones(true)

      const { data, error } = await supabase.from("zones").select("id, name").order("name")

      console.log("Respuesta de zonas:", { data, error })

      if (error) {
        console.error("Error al cargar zonas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las zonas",
          variant: "destructive",
        })
        return
      }

      setZones(data || [])
      console.log(`Zonas cargadas: ${data?.length || 0}`)
    } catch (error) {
      console.error("Error en fetchZones:", error)
      toast({
        title: "Error",
        description: "Error al conectar con la base de datos",
        variant: "destructive",
      })
    } finally {
      setLoadingZones(false)
    }
  }

  async function fetchDistributors() {
    try {
      console.log("Iniciando carga de distribuidores...")
      setLoadingDistributors(true)

      const { data, error } = await supabase.from("distributors").select("id, name").order("name")

      console.log("Respuesta de distribuidores:", { data, error })

      if (error) {
        console.error("Error al cargar distribuidores:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los distribuidores",
          variant: "destructive",
        })
        return
      }

      setDistributors(data || [])
      console.log(`Distribuidores cargados: ${data?.length || 0}`)
    } catch (error) {
      console.error("Error en fetchDistributors:", error)
      toast({
        title: "Error",
        description: "Error al conectar con la base de datos",
        variant: "destructive",
      })
    } finally {
      setLoadingDistributors(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      // Si el rol es capitán o director técnico, necesitamos guardar la zona y distribuidor
      if (role === "capitan" || role === "director_tecnico") {
        if (!selectedZone || !selectedDistributor) {
          toast({
            title: "Error",
            description: "Debes seleccionar una zona y un distribuidor para este rol",
            variant: "destructive",
          })
          return
        }
        formData.append("zoneId", selectedZone)
        formData.append("distributorId", selectedDistributor)
      }

      console.log("Enviando datos del formulario...")
      const result = await createUser(formData)

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
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input id="fullName" name="fullName" placeholder="Nombre completo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" placeholder="********" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select name="role" value={role} onValueChange={(value) => setRole(value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">FIFA</SelectItem>
                      <SelectItem value="capitan">Capitán</SelectItem>
                      <SelectItem value="director_tecnico">Director Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(role === "capitan" || role === "director_tecnico") && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="zoneId">Zona</Label>
                    <Select name="zoneId" value={selectedZone} onValueChange={setSelectedZone} required>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingZones ? "Cargando zonas..." : "Selecciona una zona"} />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.length === 0 && !loadingZones && (
                          <SelectItem value="no-zones" disabled>
                            No hay zonas disponibles
                          </SelectItem>
                        )}
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingZones && <p className="text-sm text-gray-500">Cargando zonas...</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distributorId">Distribuidor</Label>
                    <Select
                      name="distributorId"
                      value={selectedDistributor}
                      onValueChange={setSelectedDistributor}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingDistributors ? "Cargando distribuidores..." : "Selecciona un distribuidor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors.length === 0 && !loadingDistributors && (
                          <SelectItem value="no-distributors" disabled>
                            No hay distribuidores disponibles
                          </SelectItem>
                        )}
                        {distributors.map((distributor) => (
                          <SelectItem key={distributor.id} value={distributor.id}>
                            {distributor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingDistributors && <p className="text-sm text-gray-500">Cargando distribuidores...</p>}
                  </div>
                </div>
              )}

              {role === "admin" && (
                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-500">
                  Los usuarios FIFA no necesitan zonas o distribuidores asignados.
                </div>
              )}

              {/* Botón de debug para probar la carga */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={fetchZones} disabled={loadingZones}>
                  {loadingZones ? "Cargando..." : "Recargar Zonas"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchDistributors}
                  disabled={loadingDistributors}
                >
                  {loadingDistributors ? "Cargando..." : "Recargar Distribuidores"}
                </Button>
              </div>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
