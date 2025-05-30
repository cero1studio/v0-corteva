"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit, Trash2, Building } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import Link from "next/link"

interface Distributor {
  id: string
  name: string
  logo_url?: string
  created_at: string
}

export default function DistribuidoresPage() {
  const router = useRouter()
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDistributors()
  }, [])

  async function fetchDistributors() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("distributors").select("*").order("name")

      if (error) throw error

      setDistributors(data || [])
    } catch (error) {
      console.error("Error al cargar distribuidores:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los distribuidores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteDistributor(id: string, name: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el distribuidor "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const { error } = await supabase.from("distributors").delete().eq("id", id)

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el distribuidor. Asegúrate de que no tenga equipos o usuarios asociados.",
          variant: "destructive",
        })
        return
      }

      setDistributors(distributors.filter((distributor) => distributor.id !== id))

      toast({
        title: "Distribuidor eliminado",
        description: "El distribuidor ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error al eliminar distribuidor:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el distribuidor. Asegúrate de que no tenga equipos o usuarios asociados.",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Distribuidores</h2>
        <Button asChild>
          <Link href="/admin/distribuidores/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Distribuidor
          </Link>
        </Button>
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
                      {distributor.logo_url ? (
                        <div className="w-16 h-8 bg-white border rounded overflow-hidden">
                          <img
                            src={distributor.logo_url || "/placeholder.svg"}
                            alt={`Logo de ${distributor.name}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=32&width=64&text=Logo"
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
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
