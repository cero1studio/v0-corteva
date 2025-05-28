"use client"

import { useState } from "react"
import { Trophy, TrendingUp, Users, Download, Filter, Search, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TeamDetailChart } from "@/components/team-detail-chart"

// Sample data for teams in the zone
const teamsData = [
  {
    id: 1,
    name: "Los Campeones",
    representative: "Carlos Rodríguez",
    goals: 342,
    sales: 168,
    clients: 24,
    progress: 85,
    trend: "+12%",
    status: "active",
  },
  {
    id: 2,
    name: "Equipo Estrella",
    representative: "Ana Martínez",
    goals: 243,
    sales: 120,
    clients: 18,
    progress: 65,
    trend: "+8%",
    status: "active",
  },
  {
    id: 3,
    name: "Los Guerreros",
    representative: "Juan Pérez",
    goals: 198,
    sales: 95,
    clients: 15,
    progress: 55,
    trend: "+5%",
    status: "active",
  },
  {
    id: 4,
    name: "Equipo Fuerte",
    representative: "María López",
    goals: 176,
    sales: 85,
    clients: 12,
    progress: 48,
    trend: "+3%",
    status: "active",
  },
  {
    id: 5,
    name: "Los Tigres",
    representative: "Roberto Gómez",
    goals: 154,
    sales: 75,
    clients: 10,
    progress: 42,
    trend: "+2%",
    status: "active",
  },
  {
    id: 6,
    name: "Equipo Veloz",
    representative: "Laura Sánchez",
    goals: 132,
    sales: 65,
    clients: 8,
    progress: 38,
    trend: "+1%",
    status: "inactive",
  },
  {
    id: 7,
    name: "Los Águilas",
    representative: "Pedro Ramírez",
    goals: 118,
    sales: 58,
    clients: 7,
    progress: 32,
    trend: "-2%",
    status: "active",
  },
  {
    id: 8,
    name: "Equipo Rápido",
    representative: "Sofía Torres",
    goals: 98,
    sales: 48,
    clients: 6,
    progress: 28,
    trend: "-3%",
    status: "active",
  },
]

export default function EquiposPage() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)

  const handleViewTeam = (teamId: number) => {
    setSelectedTeam(teamId)
  }

  const handleBackToList = () => {
    setSelectedTeam(null)
  }

  const team = selectedTeam ? teamsData.find((t) => t.id === selectedTeam) : null

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipos de la Zona</h2>
          <p className="text-muted-foreground">Zona Norte | Total: 8 equipos</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                <span>Exportar a Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                <span>Exportar a PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedTeam ? (
        <TeamDetail team={team} onBack={handleBackToList} />
      ) : (
        <TeamsTable teams={teamsData} onViewTeam={handleViewTeam} />
      )}
    </div>
  )
}

function TeamsTable({ teams, onViewTeam }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar equipo..."
            className="w-[300px]"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Producto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              <SelectItem value="a">Producto A</SelectItem>
              <SelectItem value="b">Producto B</SelectItem>
              <SelectItem value="c">Producto C</SelectItem>
              <SelectItem value="d">Producto D</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="week">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Representante</TableHead>
                <TableHead className="text-right">Goles</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">Progreso</TableHead>
                <TableHead className="text-right">Estado</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.representative}</TableCell>
                  <TableCell className="text-right font-bold text-corteva-600">{team.goals}</TableCell>
                  <TableCell className="text-right">{team.sales}</TableCell>
                  <TableCell className="text-right">{team.clients}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24">
                        <Progress value={team.progress} className="h-2" />
                      </div>
                      <span className="w-9 text-xs">{team.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={team.status === "active" ? "default" : "secondary"}>
                      {team.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onViewTeam(team.id)}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>8</strong> equipos
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Siguiente
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}

function TeamDetail({ team, onBack }) {
  if (!team) return null

  return (
    <>
      <Button variant="outline" onClick={onBack} className="mb-4">
        ← Volver a la lista
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{team.name}</h3>
          <p className="text-muted-foreground">Representante: {team.representative}</p>
        </div>
        <Badge variant={team.status === "active" ? "default" : "secondary"} className="text-sm">
          {team.status === "active" ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles Acumulados</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.goals}</div>
            <p className="text-xs text-muted-foreground">{team.trend} desde la semana pasada</p>
            <Progress value={team.progress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Registradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.sales}</div>
            <p className="text-xs text-muted-foreground">+12 desde la semana pasada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Captados</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.clients}</div>
            <p className="text-xs text-muted-foreground">+3 desde la semana pasada</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Rendimiento</CardTitle>
              <CardDescription>Rendimiento del equipo en las últimas semanas</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamDetailChart />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
              <CardDescription>Últimas ventas registradas por el equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Kg/Litros</TableHead>
                    <TableHead className="text-right">Goles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2023-05-01</TableCell>
                    <TableCell>Producto A</TableCell>
                    <TableCell className="text-right">10</TableCell>
                    <TableCell className="text-right">25</TableCell>
                    <TableCell className="text-right font-medium text-corteva-600">12.5</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-05-03</TableCell>
                    <TableCell>Producto C</TableCell>
                    <TableCell className="text-right">5</TableCell>
                    <TableCell className="text-right">16</TableCell>
                    <TableCell className="text-right font-medium text-corteva-600">16</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-05-05</TableCell>
                    <TableCell>Producto B</TableCell>
                    <TableCell className="text-right">8</TableCell>
                    <TableCell className="text-right">14.4</TableCell>
                    <TableCell className="text-right font-medium text-corteva-600">10.8</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Captados</CardTitle>
              <CardDescription>Clientes captados de la competencia</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Finca</TableHead>
                    <TableHead>Producto Anterior</TableHead>
                    <TableHead>Producto Nuevo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2023-05-02</TableCell>
                    <TableCell>Juan Pérez</TableCell>
                    <TableCell>Finca El Amanecer</TableCell>
                    <TableCell>Competidor A</TableCell>
                    <TableCell>Producto Corteva B</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2023-05-04</TableCell>
                    <TableCell>María González</TableCell>
                    <TableCell>Finca Los Olivos</TableCell>
                    <TableCell>Competidor C</TableCell>
                    <TableCell>Producto Corteva A</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Producto</CardTitle>
              <CardDescription>Distribución de ventas por producto</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Goles</TableHead>
                    <TableHead className="text-right">% del Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Producto A</TableCell>
                    <TableCell className="text-right">65</TableCell>
                    <TableCell className="text-right font-medium text-corteva-600">162.5</TableCell>
                    <TableCell className="text-right">38.7%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Producto B</TableCell>
                    <TableCell className="text-right">42</TableCell>
                    <TableCell className="text-right font-medium text-corteva-600">75.6</TableCell>
                    <TableCell className="text-right">25.0%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Producto C</TableCell>
                    <TableCell className="text-right">38</TableCell>
                    <TableCell className="text-right font-medium text-corteva-600">121.6</TableCell>
                    <TableCell className="text-right">22.6%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Producto D</TableCell>
                    <TableCell className="text-right">23</TableCell>
                    <TableCell className="text-right font-medium text-corteva-600">27.6</TableCell>
                    <TableCell className="text-right">13.7%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
