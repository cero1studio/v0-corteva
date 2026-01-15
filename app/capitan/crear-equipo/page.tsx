"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase/client"

export default function CrearEquipoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [zone, setZone] = useState<any>(null)
  const [distributor, setDistributor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { profile, isLoading: authLoading } = useAuth()
  const { update: updateSession } = useSession()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Timeout de seguridad para evitar loading infinito
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.log("[CREAR EQUIPO] Timeout alcanzado, forzando loading a false")
        setLoading(false)
      }
    }, 10000) // 10 segundos máximo

    const fetchUserData = async () => {
      try {
        console.log("[CREAR EQUIPO] Iniciando carga de datos, authLoading:", authLoading, "profile:", !!profile)
        setLoading(true)
        setError(null)

        // Esperar a que la autenticación se cargue
        if (authLoading) {
          console.log("[CREAR EQUIPO] Esperando autenticación...")
          setLoading(false)
          return
        }

        // 1. Verificar que hay perfil (usando NextAuth)
        if (!profile) {
          setLoading(false)
          router.push("/login")
          return
        }

        console.log("Datos del perfil desde NextAuth:", {
          id: profile.id,
          role: profile.role,
          zone_id: profile.zone_id,
          distributor_id: profile.distributor_id,
          hasZone: !!profile.zone_id,
          hasDistributor: !!profile.distributor_id,
        })

        // 2. Verificar si el usuario es capitán
        if (profile.role !== "capitan") {
          setLoading(false)
          const redirectPath =
            profile.role === "admin"
              ? "/admin/dashboard"
              : profile.role === "director_tecnico"
                ? "/director-tecnico/dashboard"
                : "/login"

          router.push(redirectPath)
          return
        }

        // 3. Verificar si ya tiene equipo
        if (profile.team_id) {
          setLoading(false)
          router.push("/capitan/dashboard")
          return
        }

        // 4. Obtener datos de zona y distribuidor (no bloquear si no existen)
        console.log("[CREAR EQUIPO] Usuario tiene zone_id:", profile.zone_id, "distributor_id:", profile.distributor_id)

        // 5. Obtener datos de zona
        if (profile.zone_id) {
          const { data: zoneData, error: zoneError } = await supabase
            .from("zones")
            .select("*")
            .eq("id", profile.zone_id)
            .single()

          if (zoneError) {
            console.error("Error al obtener zona:", zoneError)
          } else {
            console.log("Datos de zona:", zoneData)
            setZone(zoneData)
          }
        }

        // 6. Obtener datos de distribuidor
        if (profile.distributor_id) {
          const { data: distData, error: distError } = await supabase
            .from("distributors")
            .select("*")
            .eq("id", profile.distributor_id)
            .single()

          if (distError) {
            console.error("Error al obtener distribuidor:", distError)
          } else {
            console.log("Datos de distribuidor:", distData)
            setDistributor(distData)
          }
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
        if (mounted) {
          console.log("[CREAR EQUIPO] Finalizando carga, estableciendo loading a false")
          setLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }

    fetchUserData()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [router, toast, profile, authLoading])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    
    // Prevenir cualquier comportamiento por defecto
    if (event.defaultPrevented) {
      return
    }
    
    console.log("[CREAR EQUIPO] Submit iniciado")
    console.log("[CREAR EQUIPO] Profile:", profile)
    console.log("[CREAR EQUIPO] Zone:", zone)
    console.log("[CREAR EQUIPO] Distributor:", distributor)
    console.log("[CREAR EQUIPO] isSubmitting:", isSubmitting)
    
    // Si ya está enviando, no hacer nada
    if (isSubmitting) {
      console.log("[CREAR EQUIPO] Ya está enviando, ignorando submit")
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const teamName = formData.get("teamName") as string

      if (!teamName || teamName.trim() === "") {
        setIsSubmitting(false)
        setError("El nombre del equipo es obligatorio")
        return
      }

      if (!profile) {
        console.error("[CREAR EQUIPO] Error: Profile no disponible")
        setIsSubmitting(false)
        setError("No se ha cargado la información del usuario. Por favor, recarga la página.")
        return
      }

      if (!profile.zone_id) {
        console.error("[CREAR EQUIPO] Error: zone_id no disponible", profile)
        setIsSubmitting(false)
        setError("No tienes una zona asignada. Contacta al administrador.")
        return
      }

      if (!profile.distributor_id) {
        console.error("[CREAR EQUIPO] Error: distributor_id no disponible", profile)
        setIsSubmitting(false)
        setError("No tienes un distribuidor asignado. Contacta al administrador.")
        return
      }

      console.log("[CREAR EQUIPO] Creando equipo con datos:", {
        name: teamName,
        zone_id: profile.zone_id,
        distributor_id: profile.distributor_id,
        profile_id: profile.id,
      })

      // 1. Crear el equipo
      console.log("[CREAR EQUIPO] Insertando equipo en Supabase...")
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: teamName.trim(),
          zone_id: profile.zone_id,
          distributor_id: profile.distributor_id,
        })
        .select()
        .single()

      if (teamError) {
        console.error("[CREAR EQUIPO] Error al crear equipo:", teamError)
        throw new Error(`Error al crear equipo: ${teamError.message}`)
      }

      if (!teamData || !teamData.id) {
        console.error("[CREAR EQUIPO] No se recibió data del equipo creado")
        throw new Error("No se pudo crear el equipo. Intenta nuevamente.")
      }

      console.log("[CREAR EQUIPO] Equipo creado exitosamente:", teamData)

      // 2. Actualizar el perfil del usuario
      console.log("[CREAR EQUIPO] Actualizando perfil con team_id:", teamData.id)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          team_id: teamData.id,
        })
        .eq("id", profile.id)

      if (updateError) {
        console.error("[CREAR EQUIPO] Error al actualizar perfil:", updateError)
        // Aunque falle la actualización del perfil, el equipo ya está creado
        // Podríamos intentar eliminarlo, pero por ahora solo mostramos el error
        throw new Error(`Error al actualizar perfil: ${updateError.message}`)
      }

      console.log("[CREAR EQUIPO] Perfil actualizado exitosamente")

      // 3. Actualizar la sesión de NextAuth con el nuevo team_id
      console.log("[CREAR EQUIPO] Actualizando sesión de NextAuth...")
      try {
        await updateSession({
          team_id: teamData.id,
          team_name: teamName.trim(),
        })
        console.log("[CREAR EQUIPO] Sesión de NextAuth actualizada")
      } catch (sessionError) {
        console.error("[CREAR EQUIPO] Error al actualizar sesión:", sessionError)
        // No fallar si la actualización de sesión falla, el equipo ya está creado
      }

      toast({
        title: "Equipo creado",
        description: "Tu equipo ha sido creado exitosamente",
      })

      // 4. Esperar un momento antes de redirigir para que el toast se muestre
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 5. Forzar recarga completa para que el middleware y el dashboard vean el nuevo team_id
      console.log("[CREAR EQUIPO] Redirigiendo al dashboard con recarga completa...")
      window.location.href = "/capitan/dashboard"
    } catch (err: any) {
      console.error("[CREAR EQUIPO] Error capturado:", err)
      const errorMessage = err.message || "Error al crear equipo. Intenta nuevamente."
      setError(errorMessage)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600 mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
        <p className="text-sm text-gray-400 mt-2">
          {authLoading ? "Verificando autenticación..." : "Cargando datos del usuario..."}
        </p>
      </div>
    )
  }

  // No bloquear el formulario con errores, solo mostrarlos como advertencias

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

            {error && (
              <div className="p-3 border border-red-300 bg-red-50 rounded-md text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-corteva-600 hover:bg-corteva-700"
                onClick={(e) => {
                  // Asegurar que el click no cause recarga
                  e.preventDefault()
                  e.stopPropagation()
                }}
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
