"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { getUserById, updateUser, getZones, getDistributors } from "@/app/actions/users"

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

export default function EditarUsuarioPage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  // Estados del formulario
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("")
  const [zoneId, setZoneId] = useState("none")
  const [distributorId, setDistributorId] = useState("none")

  // Estados de datos
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])

  // Estados de carga
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadInitialData()
    }
  }, [userId])

  // Cuando cambia el rol a admin, limpiar zona y distribuidor
  useEffect(() => {
    if (role === "admin") {
      setZoneId("none")
      setDistributorId("none")
    }
  }, [role])

  async function loadInitialData() {
    try {
      setLoadingData(true)
      setError(null)

      console.log("Cargando datos para usuario:", userId)

      // Cargar usuario
      const userResult = await getUserById(userId)
      if (userResult.error) {
        throw new Error(userResult.error)
      }

      if (userResult.data) {
        console.log("Datos del usuario:", userResult.data)
        setEmail(userResult.data.email || "")
        setFullName(userResult.data.full_name || "")
        setRole(userResult.data.role || "")
        setZoneId(userResult.data.zone_id || "none")
        setDistributorId(userResult.data.distributor_id || "none")
      }

      // Cargar zonas
      const zonesResult = await getZones()
      if (zonesResult.data) {
        setZones(zonesResult.data)
      }

      // Cargar distribuidores
      const distributorsResult = await getDistributors()
      if (distributorsResult.data) {
        setDistributors(distributorsResult.data)
      }

      console.log("Datos cargados exitosamente")
    } catch (error: any) {
      console.error("Error al cargar datos:", error)
      setError(error.message || "Error al cargar los datos del usuario")
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos del usuario",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
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
      console.log("Actualizando usuario:", userId)

      const formData = new FormData()
      formData.append("email", email)
      formData.append("fullName", fullName)
      formData.append("role", role)
      formData.append("zoneId", zoneId === "none" ? "" : zoneId)
      formData.append("distributorId", distributorId === "none" ? "" : distributorId)

      if (password.trim()) {
        formData.append("password", password)
      }

      const result = await updateUser(userId, formData)

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.warning) {
        toast({
          title: "Usuario actualizado con advertencias",
          description: result.warning,
        })
      } else {
        toast({
          title: "Usuario actualizado",
          description: result.message || "El usuario ha sido actualizado exitosamente",
        })
      }

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
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar en blanco para mantener la actual"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y apellido"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
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
                      {distributors.map((distributor) => (
                        <SelectItem key={distributor.id} value={distributor.id}>
                          {distributor.name}
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
