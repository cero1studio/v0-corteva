"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2, Building, RefreshCw } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import Link from "next/link"
import { getDistributorLogoUrl } from "@/lib/utils/image"

interface Distributor {
  id: string
  name: string
  logo_url?: string | null
  created_at: string
}

export default function DistribuidoresPage() {
  const router = useRouter()
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const loadDistributors = async () => {
      // 🚀 CACHE SIMPLE: Si ya tenemos distribuidores y no es retry, no recargar
      if (distributors.length > 0 && retryCount === 0) {
        console.log("📦 Distribuidores ya cargados - usando cache")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Timeout de seguridad para evitar loading infinito
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.log("DISTRIBUIDORES: Timeout reached, forcing loading to false")
          setLoading(false)
        }
      }, 10000)

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout: La consulta tardó demasiado")), 5000),
        )

        const fetchPromise = supabase.from("distributors").select("*").order("name")

        const result = (await Promise.race([fetchPromise, timeoutPromise])) as any

        if (result.error) throw result.error

        if (mounted) {
          setDistributors(result.data || [])
        }
      } catch (error: any) {
        if (mounted) {
          console.error("Error al cargar distribuidores:", error)
          setError(error.message || "Error al cargar distribuidores")
          toast({
            title: "Error",
            description: "No se pudieron cargar los distribuidores. " + error.message,
            variant: "destructive",
          })
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDistributors()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [retryCount, toast, distributors.length])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  async function handleDeleteDistributor(id: string, name: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el distribuidor "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    const abortController = new AbortController()

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout al eliminar distribuidor")), 3000),
      )

      const deletePromise = supabase.from("distributors").delete().eq("id", id).abortSignal(abortController.signal)

      const result = (await Promise.race([deletePromise, timeoutPromise])) as any

      if (result.error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el distribuidor. Asegúrate de que no tenga equipos o usuarios asociados.",
          variant: "destructive",
        })
        return
      }

      setDistributors((prev) => prev.filter((distributor) => distributor.id !== id))

      toast({
        title: "Distribuidor eliminado",
        description: "El distribuidor ha sido eliminado exitosamente",
      })
    } catch (error: any) {
      console.error("Error al eliminar distribuidor:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el distribuidor: " + error.message,
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
        icon={Building}
        title="Error al cargar distribuidores"
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
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Distribuidores</h2>
        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" size="icon" title="Actualizar datos">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/admin/distribuidores/nuevo">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Distribuidor
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuidores</CardTitle>
          <CardDescription>Administra los distribuidores para la competición</CardDescription>
        </CardHeader>
        <CardContent>
          {distributors.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No hay distribuidores registrados"
              description="Crea un nuevo distribuidor para comenzar"
              action={
                <Button asChild>
                  <Link href="/admin/distribuidores/nuevo">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Distribuidor
                  </Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell>
                      <div className="font-medium">{distributor.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-8 bg-white border rounded overflow-hidden">
                        <img
                          src={getDistributorLogoUrl({
                            name: distributor.name,
                            logo_url: distributor.logo_url || "/placeholder.svg",
                          })}
                          alt={`Logo de ${distributor.name}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=32&width=64&text=Logo"
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/distribuidores/editar/${distributor.id}`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDistributor(distributor.id, distributor.name)}
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
