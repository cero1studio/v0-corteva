"use client"

import { Badge } from "@/components/ui/badge"

import { Select, SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Edit, Plus, Search, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getUsers, deleteUser, getZones } from "@/app/actions/users"
import Image from "next/image"
import { getDistributorLogoUrl } from "@/lib/utils/image"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  zone_id: string | null
  distributor_id: string | null
  team_id: string | null
  zone_name: string | null
  distributor_name: string | null
  distributor_logo: string | null
  team_name: string | null
}

interface Zone {
  id: string
  name: string
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
    loadZones()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, selectedZone, selectedRole])

  async function loadUsers() {
    try {
      setLoading(true)
      const result = await getUsers()
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        setUsers(result.data || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadZones() {
    try {
      const result = await getZones()
      if (result.data) {
        setZones(result.data)
      }
    } catch (error) {
      console.error("Error al cargar zonas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      })
    }
  }

  function filterUsers() {
    let filtered = users

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por zona
    if (selectedZone !== "all") {
      if (selectedZone === "none") {
        filtered = filtered.filter((user) => !user.zone_id)
      } else {
        filtered = filtered.filter((user) => user.zone_id === selectedZone)
      }
    }

    // Filtrar por rol
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRole)
    }

    setFilteredUsers(filtered)
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario ${userName}?`)) {
      return
    }

    try {
      const result = await deleteUser(userId)
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
        loadUsers()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "capitan":
        return "bg-blue-100 text-blue-800"
      case "director_tecnico":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  function getRoleDisplayName(role: string) {
    switch (role) {
      case "admin":
        return "FIFA"
      case "capitan":
        return "Capitán"
      case "director_tecnico":
        return "Director Técnico"
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/usuarios/sincronizar">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/usuarios/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
          <CardDescription>
            Mostrando {filteredUsers.length} de {users.length} usuarios
            {selectedZone !== "all" && (
              <span className="ml-2 text-blue-600">
                • Zona: {selectedZone === "none" ? "Sin zona asignada" : zones.find((z) => z.id === selectedZone)?.name}
              </span>
            )}
            {selectedRole !== "all" && (
              <span className="ml-2 text-green-600">• Rol: {getRoleDisplayName(selectedRole)}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar usuario</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="zone-filter">Filtrar por zona</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger id="zone-filter">
                  <SelectValue placeholder="Todas las zonas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  <SelectItem value="none">Sin zona asignada</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="role-filter">Filtrar por rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-filter">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">FIFA</SelectItem>
                  <SelectItem value="capitan">Capitán</SelectItem>
                  <SelectItem value="director_tecnico">Director Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Administra los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {users.length === 0
                        ? "No hay usuarios registrados"
                        : "No se encontraron usuarios con los filtros aplicados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>{getRoleDisplayName(user.role)}</Badge>
                      </TableCell>
                      <TableCell>{user.zone_name || "-"}</TableCell>
                      <TableCell>
                        {user.distributor_name ? (
                          <div className="flex items-center gap-2">
                            {user.distributor_logo ? (
                              <Image
                                src={getDistributorLogoUrl({
                                  name: user.distributor_name,
                                  logo_url: user.distributor_logo || "/placeholder.svg",
                                })}
                                alt={user.distributor_name}
                                width={55}
                                className="object-contain"
                                unoptimized
                              />
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.team_name ? (
                          user.team_name
                        ) : user.role === "capitan" ? (
                          <span className="italic text-gray-400">Pendiente</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/usuarios/editar/${user.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
