"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

export default function CrearEquipoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [zone, setZone] = useState<any>(null)
  const [distributor, setDistributor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Obtener la sesión actual
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(`Error de sesión: ${sessionError.message}`)
        }

        if (!sessionData.session) {
          router.push("/login")
          return
        }

        const userId = sessionData.session.user.id
        console.log("ID de usuario:", userId)

        // 2. Obtener el perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (profileError) {
          throw new Error(`Error al obtener perfil: ${profileError.message}`)
        }

        console.log("Datos del perfil:", profileData)

        if (!profileData) {
          throw new Error("No se encontró el perfil del usuario")
        }

        // 3. Verificar si el usuario es capitán
        if (profileData.role !== "capitan") {
          const redirectPath =
            profileData.role === "admin"
              ? "/admin/dashboard"
              : profileData.role === "director_tecnico"
                ? "/director-tecnico/dashboard"
                : "/login"

          router.push(redirectPath)
          return
        }

        // 4. Verificar si ya tiene equipo
        if (profileData.team_id) {
          router.push("/capitan/dashboard")
          return
        }

        setUser(profileData)

        // 5. Obtener datos de zona
        if (profileData.zone_id) {
          const { data: zoneData, error: zoneError } = await supabase
            .from("zones")
            .select("*")
            .eq("id", profileData.zone_id)
            .single()

          if (zoneError) {
            console.error("Error al obtener zona:", zoneError)
          } else {
            console.log("Datos de zona:", zoneData)
            setZone(zoneData)
          }
        } else {
          console.warn("El usuario no tiene zona asignada")
        }

        // 6. Obtener datos de distribuidor
        if (profileData.distributor_id) {
          const { data: distData, error: distError } = await supabase
            .from("distributors")
            .select("*")
            .eq("id", profileData.distributor_id)
            .single()

          if (distError) {
            console.error("Error al obtener distribuidor:", distError)
          } else {
            console.log("Datos de distribuidor:", distData)
            setDistributor(distData)
          }
        } else {
          console.warn("El usuario no tiene distribuidor asignado")
        }
      } catch (err: any) {
        console.error("Error en la inicialización:", err)
        setError(err.message || "Error al cargar los datos del usuario")
        toast({
          title: "Error",
          description: err.message || "No se pudo cargar la información del usuario",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router, toast])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const teamName = formData.get("teamName") as string

      if (!teamName) {
        throw new Error("El nombre del equipo es obligatorio")
      }

      if (!user) {
        throw new Error("No se ha cargado la información del usuario")
      }

      if (!user.zone_id) {
        throw new Error("No tienes una zona asignada")
      }

      if (!user.distributor_id) {
        throw new Error("No tienes un distribuidor asignado")
      }

      console.log("Creando equipo:", {
        name: teamName,
        zone_id: user.zone_id,
        distributor_id: user.distributor_id,
      })

      // 1. Crear el equipo
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: teamName,
          zone_id: user.zone_id,
          distributor_id: user.distributor_id,
        })
        .select()
        .single()

      if (teamError) {
        throw new Error(`Error al crear equipo: ${teamError.message}`)
      }

      if (!teamData) {
        throw new Error("No se pudo crear el equipo")
      }

      console.log("Equipo creado:", teamData)

      // 2. Actualizar el perfil del usuario
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          team_id: teamData.id,
        })
        .eq("id", user.id)

      if (updateError) {
        throw new Error(`Error al actualizar perfil: ${updateError.message}`)
      }

      toast({
        title: "Equipo nombrado",
        description: "Tu equipo ha sido nombrado exitosamente",
      })

      // 3. Redirigir al dashboard
      router.push("/capitan/dashboard")
    } catch (err: any) {
      console.error("Error al crear equipo:", err)
      setError(err.message || "Error al crear equipo")
      toast({
        title: "Error",
        description: err.message || "Error al crear equipo",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => router.push("/login")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-8">
      <div>
        <h1 className="text-2xl font-bold">Panel de Capitán</h1>
        <h2 className="text-3xl font-bold tracking-tight mt-6">Nombra tu Equipo</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nombra tu equipo</CardTitle>
          <CardDescription>
            Antes de continuar, necesitas nombrar tu equipo. Este será el equipo que liderarás como capitán.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Nombre del equipo</Label>
                <Input id="teamName" name="teamName" placeholder="Nombre del equipo" required />
              </div>

              {zone ? (
                <div className="space-y-2">
                  <Label>Zona asignada</Label>
                  <div className="p-2 border rounded-md bg-muted/50">{zone.name}</div>
                </div>
              ) : (
                <div className="p-2 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-700">
                  No tienes una zona asignada. Contacta al administrador.
                </div>
              )}

              {distributor ? (
                <div className="space-y-2">
                  <Label>Distribuidor asignado</Label>
                  <div className="p-4 border rounded-md bg-white flex justify-center items-center min-h-[80px]">
                    {distributor.name.toLowerCase().includes("agralba") ? (
                      <img
                        src="/logos/agralba.png"
                        alt={distributor.name}
                        className="h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling.style.display = "block"
                        }}
                      />
                    ) : distributor.name.toLowerCase().includes("coacosta") ? (
                      <img
                        src="/logos/coacosta.png"
                        alt={distributor.name}
                        className="h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling.style.display = "block"
                        }}
                      />
                    ) : distributor.name.toLowerCase().includes("hernandez") ? (
                      <img
                        src="/logos/hernandez.png"
                        alt={distributor.name}
                        className="h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling.style.display = "block"
                        }}
                      />
                    ) : distributor.name.toLowerCase().includes("insagrin") ? (
                      <img
                        src="/logos/insagrin.png"
                        alt={distributor.name}
                        className="h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling.style.display = "block"
                        }}
                      />
                    ) : distributor.name.toLowerCase().includes("cosechar") ? (
                      <img
                        src="/logos/cosechar.png"
                        alt={distributor.name}
                        className="h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling.style.display = "block"
                        }}
                      />
                    ) : null}

                    <div
                      className="text-center text-gray-700 font-medium"
                      style={{
                        display:
                          distributor.name.toLowerCase().includes("agralba") ||
                          distributor.name.toLowerCase().includes("coacosta") ||
                          distributor.name.toLowerCase().includes("hernandez") ||
                          distributor.name.toLowerCase().includes("insagrin") ||
                          distributor.name.toLowerCase().includes("cosechar")
                            ? "none"
                            : "block",
                      }}
                    >
                      {distributor.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-700">
                  No tienes un distribuidor asignado. Contacta al administrador.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !zone || !distributor}
                className="bg-corteva-600 hover:bg-corteva-700"
              >
                {isSubmitting ? "Guardando..." : "Guardar Nombre"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
