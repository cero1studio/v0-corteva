"use client"

import { useState, useEffect, useCallback } from "react"
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
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAllCompetitorClients, deleteCompetitorClient } from "@/app/actions/competitor-clients"
import { getAllZones } from "@/app/actions/zones"
import { getAllTeams } from "@/app/actions/teams"
import { getAllUsers } from "@/app/actions/users"
import * as XLSX from "xlsx"
import Link from "next/link" // Import Link

interface CompetitorClient {
  id: string
  client_name: string
  competitor_name: string | null
  ganadero_name: string | null
  razon_social: string | null
  tipo_venta: string | null
  ubicacion_finca: string | null
  area_finca_hectareas: number | null
  producto_anterior: string | null
  producto_super_ganaderia: string | null
  volumen_venta_estimado: string | null
  contact_info: string | null
  notes: string | null
  nombre_almacen: string | null
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
  full_name: string | null
  team_id: string | null
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
    cell: ({ row }) => {
      const captain = row.original.representative_profile
      return captain ? <Badge variant="outline">{captain.full_name}</Badge> : "N/A"
    },
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

      const handleDeleteClient = async (clientId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) return

        try {
          const result = await deleteCompetitorClient(clientId)
          if (result.success) {
            toast({
              title: "Éxito",
              description: "Cliente eliminado correctamente",
            })
            setClients((prevClients) => prevClients.filter((client) => client.id !== clientId))
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

export default function AdminClientesPage() {
  const [clients, setClients] = useState<CompetitorClient[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [captains, setCaptains] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")

  const loadData = useCallback(async () => {
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
        setCaptains(usersResult.data.filter((user) => user.role === "capitan") || [])
      } else {
        setCaptains([])
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
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredClients = clients.filter((client) => {
    const ganaderoName = client.ganadero_name || ""
    const clientName = client.client_name || ""
    const competitorName = client.competitor_name || ""
    const razonSocial = client.razon_social || ""
    const tipoVenta = client.tipo_venta || ""
    const ubicacionFinca = client.ubicacion_finca || ""
    const productoAnterior = client.producto_anterior || ""
    const productoSuperGanaderia = client.producto_super_ganaderia || ""
    const volumenVentaEstimado = client.volumen_venta_estimado || ""
    const contactInfo = client.contact_info || ""
    const notes = client.notes || ""
    const nombreAlmacen = client.nombre_almacen || ""
    const captainName = client.representative_profile?.full_name || ""
    const teamName = client.team?.name || ""
    const zoneName = client.team?.zone?.name || ""

    const matchesSearch =
      ganaderoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      competitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tipoVenta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ubicacionFinca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productoAnterior.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productoSuperGanaderia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volumenVentaEstimado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nombreAlmacen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      captainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zoneName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesZone = selectedZone === "all" || client.team?.zone?.id === selectedZone
    const matchesTeam = selectedTeam === "all" || client.team?.id === selectedTeam

    return matchesSearch && matchesZone && matchesTeam
  })

  const filteredTeams = selectedZone === "all" ? teams : teams.filter((team) => team.zone_id === selectedZone)

  const downloadExcel = () => {
    try {
      if (filteredClients.length === 0) {
        toast({
          title: "Error",
          description: "No hay datos para exportar",
          variant: "destructive",
        })
        return
      }

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([[]])

      const excelData = filteredClients.map((client) => ({
        ID: client.id,
        "Nombre Cliente": client.client_name || "",
        "Nombre Ganadero": client.ganadero_name || "",
        "Cliente Competidora": client.competitor_name || "",
        "Razón Social": client.razon_social || "",
        "Tipo Venta": client.tipo_venta || "",
        "Ubicación Finca": client.ubicacion_finca || "",
        "Área Finca (Hectáreas)": client.area_finca_hectareas || "",
        "Producto Anterior": client.producto_anterior || "",
        "Producto Súper Ganadería": client.producto_super_ganaderia || "",
        "Volumen Venta Estimado": client.volumen_venta_estimado || "",
        "Información Contacto": client.contact_info || "",
        Notas: client.notes || "",
        "Nombre Almacén": client.nombre_almacen || "",
        Puntos: client.points,
        Capitán: client.representative_profile?.full_name || "",
        "ID Capitán": client.representative_profile?.id || "",
        Equipo: client.team?.name || "",
        "ID Equipo": client.team?.id || "",
        Zona: client.team?.zone?.name || "",
        "ID Zona": client.team?.zone?.id || "",
        "Fecha Registro": new Date(client.created_at).toLocaleDateString(),
        "Fecha Registro (ISO)": client.created_at,
        "Hora Registro": new Date(client.created_at).toLocaleTimeString(),
      }))

      XLSX.utils.sheet_add_json(ws, excelData, { origin: "A1", skipHeader: false })

      const colWidths = [
        { wch: 10 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 35 },
        { wch: 15 },
        { wch: 25 },
        { wch: 25 },
        { wch: 20 },
        { wch: 30 },
        { wch: 40 },
        { wch: 25 },
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ]
      ws["!cols"] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, "Clientes")

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `clientes_${new Date().toISOString().split("T")[0]}.xlsx`

      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

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
          <Link href="/admin/clientes/nuevo">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
          </Link>
        </div>
      </div>

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
