"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Team {
  id: string
  name: string
}

interface Zone {
  id: string
  name: string
}

interface Distributor {
  id: string
  name: string
}

interface Profile {
  id: string
  full_name: string | null
  role: string
  team_id: string | null
  zone_id: string | null
  distributor_id: string | null
}

export default function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("")
  const [teamId, setTeamId] = useState("")
  const [zoneId, setZoneId] = useState("")
  const [distributorId, setDistributorId] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const userId = params.id

  useEffect(() => {
    fetchTeams()
    fetchZones()
    fetchDistributors()
    fetchUserData()
  }, [userId])

  // Cuando cambia el rol a admin, eliminar el equipo, zona y distribuidor
  useEffect(() => {
    if (role === "admin") {
      setTeamId("none")
      setZoneId("none")
      setDistributorId("none")
    }
  }, [role])

  async function fetchTeams() {
    try {
      const { data, error } = await supabase.from("teams").select("id, name").order("name")

      if (error) throw error

      setTeams(data || [])
    } catch (error) {
      console.error("Error al cargar equipos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos",
        variant: "destructive",
      })
    }
  }

  async function fetchZones() {
    try {
      const { data, error } = await supabase.from("zones").select("id, name").order("name")

      if (error) throw error

      setZones(data || [])
    } catch (error) {
      console.error("Error al cargar zonas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      })
    }
  }

  async function fetchDistributors() {
    try {
      const { data, error } = await supabase.from("distributors").select("id, name").order("name")

      if (error) throw error

      setDistributors(data || [])
    } catch (error) {
      console.error("Error al cargar distribuidores:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los distribuidores",
        variant: "destructive",
      })
    }
  }

  async function fetchUserData() {
    setLoadingData(true)
    try {
      // Obtener perfil del usuario primero
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, team_id, zone_id, distributor_id, email")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError

      if (profileData) {
        setEmail(profileData.email || "")
        setFullName(profileData.full_name || "")
        setRole(profileData.role || "")
        setTeamId(profileData.team_id || "none")
        setZoneId(profileData.zone_id || "none")
        setDistributorId(profileData.distributor_id || "none")
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del usuario",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Actualizar datos de Auth si se cambió la contraseña
      if (password) {
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          password,
        })

        if (authError) throw authError
      }

      // Si es admin, asegurarse de que no tenga equipo, zona ni distribuidor
      const finalTeamId = role === "admin" ? null : teamId === "none" ? null : teamId || null
      const finalZoneId = role === "admin" ? null : zoneId === "none" ? null : zoneId || null
      const finalDistributorId = role === "admin" ? null : distributorId === "none" ? null : distributorId || null

      // Actualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          role,
          team_id: finalTeamId,
          zone_id: finalZoneId,
          distributor_id: finalDistributorId,
        })
        .eq("id", userId)

      if (profileError) throw profileError

      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      })

      router.push("/admin/usuarios")
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Editar Usuario</h2>
        <Button variant="outline" asChild>
          <Link href="/admin/usuarios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>Actualiza los datos del usuario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} disabled className="bg-gray-100" />
              <p className="text-xs text-muted-foreground">El correo electrónico no se puede modificar</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar en blanco para mantener la actual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y apellido"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="capitan">Capitán</SelectItem>
                  <SelectItem value="director_tecnico">Director Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role !== "admin" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="zone">Zona *</Label>
                  <Select value={zoneId} onValueChange={setZoneId} required>
                    <SelectTrigger id="zone">
                      <SelectValue placeholder="Selecciona una zona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin zona</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distributor">Distribuidor *</Label>
                  <Select value={distributorId} onValueChange={setDistributorId} required>
                    <SelectTrigger id="distributor">
                      <SelectValue placeholder="Selecciona un distribuidor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin distribuidor</SelectItem>
                      {distributors.map((distributor) => (
                        <SelectItem key={distributor.id} value={distributor.id}>
                          {distributor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Equipo</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Selecciona un equipo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin equipo</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {role === "admin" && (
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-500">
                Los administradores no pueden tener equipos, zonas o distribuidores asignados.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Actualizando usuario...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
