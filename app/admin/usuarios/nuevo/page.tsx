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

interface Team {
  id: string
  name: string
}

export default function NuevoUsuarioPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [role, setRole] = useState("")
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedZone, setSelectedZone] = useState("")
  const [selectedDistributor, setSelectedDistributor] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [loadingZones, setLoadingZones] = useState(false)
  const [loadingDistributors, setLoadingDistributors] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      await Promise.all([fetchZones(isMounted), fetchDistributors(isMounted), fetchTeams(isMounted)])
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  async function fetchZones(isMounted = true) {
    try {
      setLoadingZones(true)
      const { data, error } = await supabase.from("zones").select("id, name").order("name")

      if (error) throw error
      if (isMounted) {
        setZones(data || [])
      }
    } catch (error) {
      console.error("Error al cargar zonas:", error)
      if (isMounted) {
        setZones([])
      }
    } finally {
      if (isMounted) {
        setLoadingZones(false)
      }
    }
  }

  async function fetchDistributors(isMounted = true) {
    try {
      setLoadingDistributors(true)
      const { data, error } = await supabase.from("distributors").select("id, name").order("name")

      if (error) throw error
      if (isMounted) {
        setDistributors(data || [])
      }
    } catch (error) {
      console.error("Error al cargar distribuidores:", error)
      if (isMounted) {
        setDistributors([])
      }
    } finally {
      if (isMounted) {
        setLoadingDistributors(false)
      }
    }
  }

  async function fetchTeams(isMounted = true) {
    try {
      setLoadingTeams(true)
      const { data, error } = await supabase.from("teams").select("id, name").order("name")

      if (error) throw error
      if (isMounted) {
        setTeams(data || [])
      }
    } catch (error) {
      console.error("Error al cargar equipos:", error)
      if (isMounted) {
        setTeams([])
      }
    } finally {
      if (isMounted) {
        setLoadingTeams(false)
      }
    }
  }

  useEffect(() => {
    // Reset form state on mount
    setRole("")
    setSelectedZone("")
    setSelectedDistributor("")
    setSelectedTeam("")
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      // Si el rol es capitán o director técnico, necesitamos guardar la zona y distribuidor
      if (role === "capitan" || role === "director_tecnico" || role === "arbitro") {
        formData.append("zoneId", selectedZone)
        formData.append("distributorId", selectedDistributor)
        // No asignamos equipo, el capitán lo creará
        formData.delete("teamId")
      }

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
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="capitan">Capitán</SelectItem>
                      <SelectItem value="director_tecnico">Director Técnico</SelectItem>
                      <SelectItem value="arbitro">Árbitro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(role === "capitan" || role === "director_tecnico" || role === "arbitro") && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="zoneId">Zona</Label>
                    <Select name="zoneId" value={selectedZone} onValueChange={setSelectedZone} required>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingZones ? "Cargando..." : "Selecciona una zona"} />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Select
                      name="distributorId"
                      value={selectedDistributor}
                      onValueChange={setSelectedDistributor}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingDistributors ? "Cargando..." : "Selecciona un distribuidor"} />
                      </SelectTrigger>
                      <SelectContent>
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
                  Los administradores no pueden tener equipos, zonas o distribuidores asignados.
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
