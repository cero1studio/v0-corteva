import { Trophy, TrendingUp, Users, Download, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SupervisorTeamsChart } from "@/components/supervisor-teams-chart"
import Image from "next/image"

// Sample data for teams in the zone
const teamsData = [
  {
    id: 1,
    name: "Los Campeones",
    goals: 342,
    sales: 168,
    clients: 24,
    progress: 85,
    trend: "+12%",
  },
  {
    id: 2,
    name: "Equipo Estrella",
    goals: 243,
    sales: 120,
    clients: 18,
    progress: 65,
    trend: "+8%",
  },
  {
    id: 3,
    name: "Los Guerreros",
    goals: 198,
    sales: 95,
    clients: 15,
    progress: 55,
    trend: "+5%",
  },
  {
    id: 4,
    name: "Equipo Fuerte",
    goals: 176,
    sales: 85,
    clients: 12,
    progress: 48,
    trend: "+3%",
  },
  {
    id: 5,
    name: "Los Tigres",
    goals: 154,
    sales: 75,
    clients: 10,
    progress: 42,
    trend: "+2%",
  },
]

export default function SupervisorDashboard() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Supervisor</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Zona Norte |
            <span className="flex items-center">
              Distribuidor:
              <span className="inline-flex items-center ml-1">
                <Image
                  src="/abstract-geometric-ad.png"
                  alt="Logo Distribuidor"
                  width={20}
                  height={20}
                  className="rounded-full mr-1"
                />
                <span>AgroDistribuciones</span>
              </span>
            </span>
          </p>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goles Zona</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">+85 desde la semana pasada</p>
            <Progress value={72} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas Zona</CardTitle>
            <TrendingUp className="h-4 w-4 text-corteva-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">543</div>
            <p className="text-xs text-muted-foreground">+42 desde la semana pasada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes Captados</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">79</div>
            <p className="text-xs text-muted-foreground">+8 desde la semana pasada</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Equipos de la Zona</CardTitle>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead className="text-right">Goles</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Clientes Captados</TableHead>
                <TableHead className="text-right">Progreso</TableHead>
                <TableHead className="text-right">Tendencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamsData.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
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
                  <TableCell className="text-right text-corteva-600">{team.trend}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">Mostrando 5 equipos de la Zona Norte</p>
          <Button variant="outline" size="sm">
            Ver todos los equipos
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Comparativa de Equipos</CardTitle>
            <CardDescription>Rendimiento de los equipos en la zona</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SupervisorTeamsChart />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>Distribución de ventas por producto</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Goles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Producto A</TableCell>
                  <TableCell className="text-right">187</TableCell>
                  <TableCell className="text-right font-medium text-corteva-600">468</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Producto B</TableCell>
                  <TableCell className="text-right">142</TableCell>
                  <TableCell className="text-right font-medium text-corteva-600">320</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Producto C</TableCell>
                  <TableCell className="text-right">98</TableCell>
                  <TableCell className="text-right font-medium text-corteva-600">294</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Producto D</TableCell>
                  <TableCell className="text-right">116</TableCell>
                  <TableCell className="text-right font-medium text-corteva-600">163</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
