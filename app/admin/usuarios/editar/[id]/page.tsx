"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserById, getZones, getDistributors, updateUser, diagnoseUser } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"

export default function EditarUsuario({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [zones, setZones] = useState<any[]>([])
  const [distributors, setDistributors] = useState<any[]>([])
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Cargar datos del usuario
        const userResult = await getUserById(params.id)
        if (userResult.error) {
          setError(userResult.error)
          return
        }
        setUser(userResult.data)

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

        // Cargar diagnóstico
        const diagResult = await diagnoseUser(params.id)
        setDiagnosticInfo(diagResult)
      } catch (err: any) {
        setError(err.message || "Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setWarning(null)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateUser(params.id, formData)

      if (result.error) {
        setError(result.error)
      } else if (result.warning) {
        setWarning(result.warning)
        setSuccess("Perfil actualizado correctamente")
      } else {
        setSuccess(result.message || "Usuario actualizado exitosamente")
      }

      // Actualizar diagnóstico después de la actualización
      const diagResult = await diagnoseUser(params.id)
      setDiagnosticInfo(diagResult)
    } catch (err: any) {
      setError(err.message || "Error al actualizar usuario")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No se pudo cargar el usuario. {error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/admin/usuarios")}>
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Editar Usuario</h1>
        <Button variant="outline" onClick={() => router.push("/admin/usuarios")}>
          Volver
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warning && (
        <Alert variant="warning" className="mb-4 border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Advertencia</AlertTitle>
          <AlertDescription className="text-yellow-700">{warning}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="mb-4 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Éxito</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>
            Edita la información del usuario. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={user.full_name}
                  required
                  placeholder="Nombre Completo"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <Select name="role" defaultValue={user.role} required>
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
              <div className="space-y-2">
                <Label htmlFor="zoneId">Zona</Label>
                <Select name="zoneId" defaultValue={user.zone_id || "none"}>
                  <SelectTrigger>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distributorId">Distribuidor</Label>
                <Select name="distributorId" defaultValue={user.distributor_id || "none"}>
                  <SelectTrigger>
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
                <Label htmlFor="password">Contraseña (dejar en blanco para mantener)</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Nueva contraseña (mínimo 6 caracteres)"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDiagnostic(!showDiagnostic)}
                className="mb-4"
              >
                {showDiagnostic ? "Ocultar diagnóstico" : "Mostrar diagnóstico"}
              </Button>

              {showDiagnostic && diagnosticInfo && (
                <div className="bg-gray-50 p-4 rounded-md border text-sm">
                  <h3 className="font-medium mb-2">Diagnóstico del usuario</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>Estado en base de datos:</strong>{" "}
                      {diagnosticInfo.profile ? (
                        <span className="text-green-600">✓ Encontrado</span>
                      ) : (
                        <span className="text-red-600">✗ No encontrado</span>
                      )}
                    </div>
                    <div>
                      <strong>Estado en autenticación:</strong>{" "}
                      {diagnosticInfo.auth ? (
                        <span className="text-green-600">✓ Encontrado</span>
                      ) : (
                        <span className="text-red-600">✗ No encontrado</span>
                      )}
                    </div>
                    {diagnosticInfo.profileError && (
                      <div className="col-span-2">
                        <strong>Error en base de datos:</strong>{" "}
                        <span className="text-red-600">{diagnosticInfo.profileError}</span>
                      </div>
                    )}
                    {diagnosticInfo.authError && (
                      <div className="col-span-2">
                        <strong>Error en autenticación:</strong>{" "}
                        <span className="text-red-600">{diagnosticInfo.authError}</span>
                      </div>
                    )}
                    {diagnosticInfo.auth && (
                      <div className="col-span-2 mt-2">
                        <strong>ID en autenticación:</strong> {diagnosticInfo.auth.id}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/usuarios")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
