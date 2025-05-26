"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Search, Trash2, Edit, Loader2 } from "lucide-react"
import Link from "next/link"
import { deleteDistributor, getDistributors } from "@/app/actions/distributors"
import { getDistributorLogoUrl } from "@/lib/utils/image"

interface Distributor {
  id: string
  name: string
  logo_url?: string | null
  address?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
}

export default function DistribuidoresPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [filteredDistributors, setFilteredDistributors] = useState<Distributor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDistributors()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = distributors.filter((distributor) =>
        distributor.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredDistributors(filtered)
    } else {
      setFilteredDistributors(distributors)
    }
  }, [searchTerm, distributors])

  async function fetchDistributors() {
    try {
      setLoading(true)
      const data = await getDistributors()
      console.log("Distribuidores obtenidos:", data)
      setDistributors(data || [])
      setFilteredDistributors(data || [])
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

  async function handleDeleteDistributor(id: string) {
    try {
      const result = await deleteDistributor(id)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Distribuidor eliminado",
        description: "El distribuidor ha sido eliminado exitosamente",
      })

      // Actualizar la lista de distribuidores
      await fetchDistributors()
    } catch (error: any) {
      console.error("Error al eliminar distribuidor:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el distribuidor",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Distribuidores</h2>
        <Button asChild>
          <Link href="/admin/distribuidores/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Distribuidor
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Distribuidores</CardTitle>
          <CardDescription>Administra los distribuidores del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-corteva-600" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Logo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistributors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No se encontraron distribuidores
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDistributors.map((distributor) => {
                      const logoUrl = getDistributorLogoUrl(distributor)
                      console.log(`Logo URL para ${distributor.name}:`, logoUrl)

                      return (
                        <TableRow key={distributor.id}>
                          <TableCell>
                            <div className="relative h-12 w-24 overflow-hidden rounded-md border">
                              <img
                                src={logoUrl || "/placeholder.svg"}
                                alt={distributor.name}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  console.error(`Error al cargar imagen para ${distributor.name}:`, logoUrl)
                                  e.currentTarget.src = "/placeholder.svg"
                                }}
                                onLoad={() => {
                                  console.log(`Imagen cargada exitosamente para ${distributor.name}:`, logoUrl)
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{distributor.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="icon" asChild>
                                <Link href={`/admin/distribuidores/editar/${distributor.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente el distribuidor del
                                      sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDeleteDistributor(distributor.id)}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
