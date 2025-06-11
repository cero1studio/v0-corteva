"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createUser } from "@/app/actions/users"
import { supabase } from "@/lib/supabase/client"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NuevoUsuario() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [zones, setZones] = useState<any[]>([])
  const [distributors, setDistributors] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "",
    zone_id: "",
    distributor_id: "",
    team_id: "",
  })

  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      try {
        setLoadingData(true)

        // Reset form data
        setFormData({
          email: "",
          password: "",
          full_name: "",
          role: "",
          zone_id: "",
          distributor_id: "",
          team_id: "",
        })

        // Cargar zonas
        const { data: zonesData, error: zonesError } = await supabase.from("zones").select("*").order("name")

        if (zonesError) throw zonesError

        // Cargar distribuidores
        const { data: distributorsData, error: distributorsError } = await supabase
          .from("distributors")
          .select("*")
          .order("name")

        if (distributorsError) throw distributorsError

        // Cargar equipos
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select(`
            *,
            zones:zone_id(name),
            distributors:distributor_id(name)
          `)
          .order("name")

        if (teamsError) throw teamsError

        if (isMounted) {
          setZones(zonesData || [])
          setDistributors(distributorsData || [])
          setTeams(teamsData || [])
        }
      } catch (error: any) {
        console.error("Error cargando datos:", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos necesarios",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setLoadingData(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createUser(formData)

      if (result.success) {
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado exitosamente",
        })
        router.push("/admin/usuarios")
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el usuario",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error?.message || "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Reset dependent fields when parent changes
    if (field === "role") {
      setFormData((prev) => ({
        ...prev,
        zone_id: "",
        distributor_id: "",
        team_id: "",
      }))
    } else if (field === "zone_id") {
      setFormData((prev) => ({
        ...prev,
        team_id: "",
      }))
    } else if (field === "distributor_id") {
      setFormData((prev) => ({
        ...prev,
        team_id: "",
      }))
    }
  }

  // Filtrar equipos según zona y distribuidor seleccionados
  const getFilteredTeams = () => {
    let filtered = teams

    if (formData.zone_id) {
      filtered = filtered.filter((team) => team.zone_id === formData.zone_id)
    }

    if (formData.distributor_id) {
      filtered = filtered.filter((team) => team.distributor_id === formData.distributor_id)
    }

    return filtered
  }

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/usuarios">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
          <p className="text-muted-foreground">Crear un nuevo usuario en el sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>Complete los datos del nuevo usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="capitan">Capitán</SelectItem>
                    <SelectItem value="representante">Representante</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="director_tecnico">Director Técnico</SelectItem>
                    <SelectItem value="arbitro">Árbitro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.role === "capitan" ||
                formData.role === "representante" ||
                formData.role === "supervisor" ||
                formData.role === "director_tecnico" ||
                formData.role === "arbitro") && (
                <div className="space-y-2">
                  <Label htmlFor="zone_id">Zona</Label>
                  <Select value={formData.zone_id} onValueChange={(value) => handleInputChange("zone_id", value)}>
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
                </div>
              )}

              {(formData.role === "capitan" || formData.role === "representante") && (
                <div className="space-y-2">
                  <Label htmlFor="distributor_id">Distribuidor</Label>
                  <Select
                    value={formData.distributor_id}
                    onValueChange={(value) => handleInputChange("distributor_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar distribuidor" />
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
              )}

              {(formData.role === "capitan" || formData.role === "representante") && formData.zone_id && (
                <div className="space-y-2">
                  <Label htmlFor="team_id">Equipo</Label>
                  <Select value={formData.team_id} onValueChange={(value) => handleInputChange("team_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredTeams().map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} - {team.zones?.name} - {team.distributors?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/usuarios">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
