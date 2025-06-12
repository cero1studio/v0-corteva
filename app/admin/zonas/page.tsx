"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2, MapPin, RefreshCw } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import Link from "next/link"

interface Zone {
  id: string
  name: string
  description?: string | null
  created_at: string
}

export default function ZonasPage() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()

  const fetchZones = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Establecer un timeout para evitar carga infinita
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("La consulta está tardando demasiado")), 8000),
      )

      // Consulta a Supabase
      const fetchPromise = supabase.from("zones").select("*").order("name")

      // Race entre el timeout y la consulta
      const result = (await Promise.race([fetchPromise, timeoutPromise])) as any

      if (result.error) throw result.error

      setZones(result.data || [])
      setLoading(false)
    } catch (error: any) {
      console.error("Error al cargar zonas:", error)
      setError(error.message || "Error al cargar zonas")
      setLoading(false)

      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas. " + error.message,
        variant: "destructive",
      })
    }
  }, [toast])

  // Usar useEffect con dependencia en retryCount para permitir reintentos
  useEffect(() => {
    fetchZones()
  }, [fetchZones, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  async function handleDeleteZone(id: string, name: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la zona "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const { error } = await supabase.from("zones").delete().eq("id", id)

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la zona. Asegúrate de que no tenga equipos o usuarios asociados.",
          variant: "destructive",
        })
        return
      }

      setZones(zones.filter((zone) => zone.id !== id))

      toast({
        title: "Zona eliminada",
        description: "La zona ha sido eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error al eliminar zona:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la zona. Asegúrate de que no tenga equipos o usuarios asociados.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="rounded-lg border">
          <div className="p-6 space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>

            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={MapPin}
        title="Error al cargar zonas"
        description={error}
        actionLabel="Reintentar"
        onClick={handleRetry}
        className="py-10"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Zonas</h2>
        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" size="icon" title="Actualizar datos">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/admin/zonas/nuevo">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Zona
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zonas</CardTitle>
          <CardDescription>Administra las zonas geográficas para la competición</CardDescription>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No hay zonas registradas"
              description="Crea una nueva zona para comenzar"
              action={
                <Button asChild>
                  <Link href="/admin/zonas/nuevo">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Zona
                  </Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div className="font-medium">{zone.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{zone.description || "Sin descripción"}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/zonas/editar/${zone.id}`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteZone(zone.id, zone.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
