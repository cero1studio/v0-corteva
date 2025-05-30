"use client"

import { useState, useEffect } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, Search, Filter, MoreHorizontal, Edit, Trash2, Users, Download } from "lucide-react"
import { ClientForm } from "./components/client-form"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAllCompetitorClients, deleteCompetitorClient } from "@/app/actions/competitor-clients"
import { getAllZones } from "@/app/actions/zones"
import { getAllTeams } from "@/app/actions/teams"
import { getAllUsers } from "@/app/actions/users"

interface CompetitorClient {
  id: string
  client_name: string
  client_name_competitora: string | null
  ganadero_name: string | null
  razon_social: string | null
  tipo_venta: string | null
  ubicacion_finca: string | null
  area_finca_hectareas: number | null
  producto_anterior: string | null
  producto_super_ganaderia: string | null
  volumen_venta_estimado: string | null
  points: number
  created_at: string
  representative_profile: {
    id: string
    full_name: string
  } | null
  team: {
    id: string
    name: string
    zone: {
      id: string
      name: string
    } | null
  } | null
}

interface Zone {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  zone_id: string
}

interface User {
  id: string
  full_name: string
  team_id: string
  role: string
}

const columns: ColumnDef<CompetitorClient>[] = [
  {
    accessorKey: "ganadero_name",
    header: "Ganadero",
    cell: ({ row }) => {
      return row.original.ganadero_name || row.original.client_name
    },
  },
  {
    accessorKey: "volumen_venta_estimado",
    header: "Volumen de Venta Estimado",
    cell: ({ row }) => {
      return row.original.volumen_venta_estimado || "N/A"
    },
  },
  {
    accessorKey: "representative_profile.full_name",
    header: "Capitán",
  },
  {
    accessorKey: "team.name",
    header: "Equipo",
    cell: ({ row }) => {
      const team = row.original.team
      return team ? <Badge variant="outline">{team.name}</Badge> : "N/A"
    },
  },
  {
    accessorKey: "team.zone.name",
    header: "Zona",
    cell: ({ row }) => {
      const zone = row.original.team?.zone
      return zone ? <Badge variant="secondary">{zone.name}</Badge> : "N/A"
    },
  },
  {
    accessorKey: "tipo_venta",
    header: "Tipo Venta",
  },
  {
    accessorKey: "area_finca_hectareas",
    header: "Área (Ha)",
    cell: ({ row }) => {
      const area = row.original.area_finca_hectareas
      return area ? `${area} ha` : "N/A"
    },
  },
  {
    accessorKey: "points",
    header: "Puntos",
    cell: ({ row }) => {
      return <Badge variant="default">{row.original.points}</Badge>
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha Registro",
    cell: ({ row }) => {
      return new Date(row.original.created_at).toLocaleDateString()
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => alert("Editar - Por implementar")}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const handleDeleteClient = async (clientId: string) => {
  if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) return

  try {
    const result = await deleteCompetitorClient(clientId)
    if (result.success) {
      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente",
      })
      // Recargar datos
      window.location.reload()
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al eliminar cliente",
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("Error deleting client:", error)
    toast({
      title: "Error",
      description: "Error al eliminar cliente",
      variant: "destructive",
    })
  }
}

export default function AdminClientesPage() {
  const [clients, setClients] = useState<CompetitorClient[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [clientsResult, zonesData, teamsResult, usersResult] = await Promise.all([
        getAllCompetitorClients(),
        getAllZones(),
        getAllTeams(),
        getAllUsers(),
      ])

      if (clientsResult.success) {
        setClients(clientsResult.data || [])
      } else {
        console.error("Error loading clients:", clientsResult.error)
        toast({
          title: "Error",
          description: "Error al cargar los clientes",
          variant: "destructive",
        })
      }

      if (zonesData && Array.isArray(zonesData)) {
        setZones(zonesData)
      } else {
        setZones([])
      }

      if (teamsResult.success) {
        setTeams(teamsResult.data || [])
      } else {
        setTeams([])
      }

      if (usersResult.data) {
        setUsers(usersResult.data || [])
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const ganaderoName = client.ganadero_name || ""
    const clientName = client.client_name || ""
    const teamName = client.team?.name || ""
    const zoneName = client.team?.zone?.name || ""
    const volumenVentaEstimado = client.volumen_venta_estimado || ""

    const matchesSearch =
      ganaderoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volumenVentaEstimado.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesZone = selectedZone === "all" || client.team?.zone?.id === selectedZone
    const matchesTeam = selectedTeam === "all" || client.team?.id === selectedTeam

    return matchesSearch && matchesZone && matchesTeam
  })

  const filteredTeams = selectedZone === "all" ? teams : teams.filter((team) => team.zone_id === selectedZone)

  const downloadExcel = () => {
    try {
      const excelData = filteredClients.map((client) => ({
        Ganadero: client.ganadero_name || client.client_name,
        "Volumen de Venta Estimado": client.volumen_venta_estimado || "",
        "Cliente Competidora": client.client_name_competitora || "",
        "Razón Social": client.razon_social || "",
        "Tipo Venta": client.tipo_venta || "",
        "Ubicación Finca": client.ubicacion_finca || "",
        "Área (Ha)": client.area_finca_hectareas || "",
        "Producto Anterior": client.producto_anterior || "",
        "Producto Súper Ganadería": client.producto_super_ganaderia || "",
        Puntos: client.points,
        Capitán: client.representative_profile?.full_name || "",
        Equipo: client.team?.name || "",
        Zona: client.team?.zone?.name || "",
        "Fecha Registro": new Date(client.created_at).toLocaleDateString(),
      }))

      const headers = Object.keys(excelData[0] || {})
      const csvContent = [
        headers.join(","),
        ...excelData.map((row) => headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `clientes_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Éxito",
        description: "Archivo Excel descargado correctamente",
      })
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast({
        title: "Error",
        description: "Error al descargar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const table = useReactTable({
    data: filteredClients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corteva-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administra todos los clientes captados de la competencia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} disabled={filteredClients.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
          </Button>
          <Button onClick={() => setOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Agregar Cliente
          </Button>
        </div>
      </div>

      <ClientForm open={open} setOpen={setOpen} zones={zones} teams={teams} users={users} onSuccess={loadData} />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por ganadero, equipo, volumen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zone">Zona</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las zonas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="team">Equipo</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los equipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los equipos</SelectItem>
                  {filteredTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedZone("all")
                  setSelectedTeam("all")
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Registrados</CardTitle>
          <CardDescription>
            {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""} encontrado
            {filteredClients.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay clientes</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedZone !== "all" || selectedTeam !== "all"
                  ? "No se encontraron clientes con los filtros aplicados"
                  : "Aún no hay clientes registrados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}
