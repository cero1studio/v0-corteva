"use client"

import { useState, useEffect } from "react"
import { getUsers, deleteUser } from "@/app/actions/users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Trash2, Plus, UserCheck, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { getDistributorLogoUrl } from "@/lib/utils/image"

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const result = await getUsers()

      console.log("Resultado de getUsers:", result)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        setUsers([])
      } else {
        setUsers(result.data || [])
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      const result = await deleteUser(userToDelete)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado exitosamente",
        })
        fetchUsers()
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "admin":
        return (
          <Badge variant="default" className="bg-blue-500">
            Administrador
          </Badge>
        )
      case "capitan":
        return (
          <Badge variant="default" className="bg-corteva-600">
            Capitán
          </Badge>
        )
      case "director_tecnico":
        return (
          <Badge variant="default" className="bg-green-600">
            Director Técnico
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  function getTeamStatus(user: any) {
    if (user.role !== "capitan") return null

    if (user.team_id) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <UserCheck className="mr-1 h-3 w-3" />
          Equipo creado
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertCircle className="mr-1 h-3 w-3" />
          Pendiente de crear equipo
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
        <Button asChild>
          <Link href="/admin/usuarios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Administra los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-600"></div>
            </div>
          ) : users.length === 0 ? (
            <EmptyState title="No hay usuarios" description="No se encontraron usuarios en el sistema" icon="users" />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "Sin nombre"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.role !== "admin" ? (
                          <div className="text-sm">{user.team_name || "Sin equipo"}</div>
                        ) : (
                          <div className="text-sm text-gray-400">N/A</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role !== "admin" ? (
                          <div className="text-sm">{user.zone_name || "Sin zona"}</div>
                        ) : (
                          <div className="text-sm text-gray-400">N/A</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role !== "admin" ? (
                          <div className="flex justify-center">
                            {user.distributor_name ? (
                              <img
                                src={
                                  getDistributorLogoUrl({
                                    name: user.distributor_name,
                                    logo_url: user.distributor_logo,
                                  }) || "/placeholder.svg"
                                }
                                alt={user.distributor_name}
                                className="h-8 w-16 object-contain"
                                title={user.distributor_name}
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=32&width=64&text=Logo"
                                }}
                              />
                            ) : (
                              <div className="text-sm text-gray-400">Sin distribuidor</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">N/A</div>
                        )}
                      </TableCell>
                      <TableCell>{getTeamStatus(user)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/admin/usuarios/editar/${user.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setUserToDelete(user.id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteUser()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
