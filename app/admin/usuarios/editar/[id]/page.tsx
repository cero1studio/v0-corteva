"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getUserById, updateUser, getZones, getDistributors } from "@/app/actions/users"

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

interface PageProps {
  params: { id: string }
}

export default function EditarUsuarioPage({ params }: PageProps) {
  const [showPassword, setShowPassword] = useState(false)
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const userId = params.id

  useEffect(() => {
    loadInitialData()
  }, [userId])

  useEffect(() => {
    if (role === "admin") {
      setTeamId("none")
      setZoneId("none")
      setDistributorId("none")
    }
  }, [role])

  async function loadInitialData() {
    try {
      setLoadingData(true)
      setError(null)

      const [userResult, zonesResult, distributorsResult, teamsResult] = await Promise.all([
        getUserById(userId),
        getZones(),
        getDistributors(),
        fetchTeams(),
      ])

      if (userResult.error) throw new Error(userResult.error)

      if (userResult.data) {
        setEmail(userResult.data.email || "")
        setFullName(userResult.data.full_name || "")
        setRole(userResult.data.role || "")
        setTeamId(userResult.data.team_id || "none")
        setZoneId(userResult.data.zone_id || "none")
        setDistributorId(userResult.data.distributor_id || "none")
      }

      if (!zonesResult.error) setZones(zonesResult.data || [])
      if (!distributorsResult.error) setDistributors(distributorsResult.data || [])
      setTeams(teamsResult || [])
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  async function fetchTeams() {
    try {
      const { createServerClient } = await import("@/lib/supabase/client")
      const supabase = createServerClient()
      const { data, error } = await supabase.from("teams").select("id, name").order("name")
      if (error) {
        console.warn("Error al cargar equipos:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.warn("Error al cargar equipos:", error)
      return []
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !fullName || !role) {
      toast({
        title: "Error",
        description: "Los campos email, nombre y rol son obligatorios",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("fullName", fullName)
      formData.append("role", role)
      formData.append("zoneId", zoneId === "none" ? "" : zoneId)
      formData.append("distributorId", distributorId === "none" ? "" : distributorId)
      if (password.trim()) formData.append("password", password)

      const result = await updateUser(userId, formData)

      if (result.error) throw new Error(result.error)

      toast({
        title: result.warning ? "Usuario actualizado con advertencias" : "Usuario actualizado",
        description: result.message || result.warning,
        variant: result.warning ? "default" : "success",
      })

      router.push("/admin/usuarios")
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
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
          <CardContent className="flex justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
              <span>Cargando datos del usuario...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
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
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-red-500 text-center">
              <h3 className="text-lg font-semibold">Error al cargar usuario</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={loadInitialData} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
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
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña (opcional)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar en blanco para mantener la actual"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
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
                  <SelectItem value="arbitro">Árbitro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role !== "admin" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="zone">Zona</Label>
                  <Select value={zoneId} onValueChange={setZoneId}>
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
                  <Label htmlFor="distributor">Distribuidor</Label>
                  <Select value={distributorId} onValueChange={setDistributorId}>
                    <SelectTrigger id="distributor">
                      <SelectValue placeholder="Selecciona un distribuidor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin distribuidor</SelectItem>
                      {distributors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Equipo</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Selecciona un equipo" />
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
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
