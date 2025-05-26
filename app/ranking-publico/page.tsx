import Link from "next/link"
import { Trophy, Medal, ArrowLeft, Search, Filter, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PublicRankingChart } from "@/components/public-ranking-chart"

// Sample data for rankings
const nationalRanking = [
  { position: 1, team: "Los Campeones", zone: "Norte", goals: 342, icon: "🥇" },
  { position: 2, team: "Equipo Ganador", zone: "Sur", goals: 315, icon: "🥈" },
  { position: 3, team: "Los Invencibles", zone: "Este", goals: 298, icon: "🥉" },
  { position: 4, team: "Fuerza Total", zone: "Oeste", goals: 276, icon: "" },
  { position: 5, team: "Los Triunfadores", zone: "Central", goals: 254, icon: "" },
  { position: 6, team: "Equipo Estrella", zone: "Norte", goals: 243, icon: "" },
  { position: 7, team: "Los Líderes", zone: "Sur", goals: 231, icon: "" },
  { position: 8, team: "Equipo Élite", zone: "Este", goals: 225, icon: "" },
  { position: 9, team: "Los Victoriosos", zone: "Oeste", goals: 218, icon: "" },
  { position: 10, team: "Equipo Campeón", zone: "Central", goals: 210, icon: "" },
]

const zoneRanking = {
  norte: [
    { position: 1, team: "Los Campeones", goals: 342, icon: "🥇" },
    { position: 2, team: "Equipo Estrella", goals: 243, icon: "🥈" },
    { position: 3, team: "Los Guerreros", goals: 198, icon: "🥉" },
    { position: 4, team: "Equipo Fuerte", goals: 176, icon: "" },
    { position: 5, team: "Los Tigres", goals: 154, icon: "" },
  ],
  sur: [
    { position: 1, team: "Equipo Ganador", goals: 315, icon: "🥇" },
    { position: 2, team: "Los Líderes", goals: 231, icon: "🥈" },
    { position: 3, team: "Equipo Veloz", goals: 187, icon: "🥉" },
    { position: 4, team: "Los Águilas", goals: 165, icon: "" },
    { position: 5, team: "Equipo Rápido", goals: 143, icon: "" },
  ],
}

export default function RankingPublicoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <img src="/corteva-logo.png" alt="Logo de Corteva" className="h-10" />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-green-700">Super Ganadería Concurso</h1>
              <p className="text-sm text-muted-foreground">Ranking Nacional</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-corteva-600 hover:bg-corteva-700 gap-1">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-700 mb-2">Ranking del Concurso</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conoce a los equipos líderes en el concurso Super Ganadería de Corteva. Actualizado en tiempo real con los
            últimos resultados.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Trophy className="h-5 w-5 text-yellow-500" />
                1er Lugar
              </CardTitle>
              <CardDescription className="text-yellow-700">Líder nacional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                  🥇
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-800">{nationalRanking[0].team}</h3>
                  <p className="text-yellow-700">Zona {nationalRanking[0].zone}</p>
                  <p className="text-2xl font-bold text-yellow-800">{nationalRanking[0].goals} goles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Medal className="h-5 w-5 text-gray-400" />
                2do Lugar
              </CardTitle>
              <CardDescription className="text-gray-700">Subcampeón nacional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                  🥈
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{nationalRanking[1].team}</h3>
                  <p className="text-gray-700">Zona {nationalRanking[1].zone}</p>
                  <p className="text-2xl font-bold text-gray-800">{nationalRanking[1].goals} goles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Medal className="h-5 w-5 text-amber-600" />
                3er Lugar
              </CardTitle>
              <CardDescription className="text-amber-700">Tercer puesto nacional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                  🥉
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-800">{nationalRanking[2].team}</h3>
                  <p className="text-amber-700">Zona {nationalRanking[2].zone}</p>
                  <p className="text-2xl font-bold text-amber-800">{nationalRanking[2].goals} goles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="nacional" className="space-y-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <TabsList className="h-10">
              <TabsTrigger value="nacional" className="text-sm">
                Ranking Nacional
              </TabsTrigger>
              <TabsTrigger value="zona" className="text-sm">
                Ranking por Zona
              </TabsTrigger>
              <TabsTrigger value="grafico" className="text-sm">
                Gráfico Comparativo
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar equipo..." className="w-full md:w-[200px] pl-8" />
              </div>

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

              <Select defaultValue="all">
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Distribuidor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="flex items-center gap-2">
                    <span>Todos los distribuidores</span>
                  </SelectItem>
                  <SelectItem value="distribuidor-norte" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 overflow-hidden rounded-full">
                        <img
                          src="/dna-double-helix.png"
                          alt="Logo Distribuidor Norte"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>Distribuidor Norte</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="agro-distribuciones" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 overflow-hidden rounded-full">
                        <img
                          src="/abstract-geometric-ad.png"
                          alt="Logo Agro Distribuciones"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>Agro Distribuciones</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="distribuidora-central" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 overflow-hidden rounded-full">
                        <img
                          src="/dc-skyline-night.png"
                          alt="Logo Distribuidora Central"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>Distribuidora Central</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="agro-suministros" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 overflow-hidden rounded-full">
                        <img
                          src="/abstract-geometric-as.png"
                          alt="Logo Agro Suministros"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>Agro Suministros</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="nacional" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  TOP 10 Nacional
                </CardTitle>
                <CardDescription>Los mejores equipos a nivel nacional</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nationalRanking.map((team) => (
                      <TableRow key={team.position}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {team.position}
                            {team.icon && <span className="text-lg">{team.icon}</span>}
                          </div>
                        </TableCell>
                        <TableCell>{team.team}</TableCell>
                        <TableCell>{team.zone}</TableCell>
                        <TableCell className="text-right font-bold text-corteva-600">{team.goals}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="col-span-1 md:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-yellow-500" />
                    Zona Ganadora
                  </CardTitle>
                  <CardDescription>La zona con mayor puntaje acumulado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-8 py-4">
                    <div className="text-center">
                      <img
                        src="/zona-norte-urban.png"
                        alt="Logo Zona Norte"
                        className="mx-auto h-20 w-20 rounded-full border-4 border-yellow-400"
                      />
                      <h3 className="mt-2 text-xl font-bold">Zona Norte</h3>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-corteva-600">1,245</div>
                      <p className="text-sm text-muted-foreground">Goles totales</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold">8</div>
                      <p className="text-sm text-muted-foreground">Equipos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="zona" className="space-y-6">
            <div className="mb-4">
              <Select defaultValue="norte">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="norte">Zona Norte</SelectItem>
                  <SelectItem value="sur">Zona Sur</SelectItem>
                  <SelectItem value="este">Zona Este</SelectItem>
                  <SelectItem value="oeste">Zona Oeste</SelectItem>
                  <SelectItem value="central">Zona Central</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  TOP 5 Zona Norte
                </CardTitle>
                <CardDescription>Los mejores equipos de la zona</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zoneRanking.norte.map((team) => (
                      <TableRow key={team.position}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {team.position}
                            {team.icon && <span className="text-lg">{team.icon}</span>}
                          </div>
                        </TableCell>
                        <TableCell>{team.team}</TableCell>
                        <TableCell className="text-right font-bold text-corteva-600">{team.goals}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grafico" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Comparativa de Equipos
                </CardTitle>
                <CardDescription>Visualización gráfica del ranking nacional</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <PublicRankingChart />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-center">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Descargar Ranking Completo
          </Button>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/corteva-logo.png" alt="Logo de Corteva" className="h-8" />
              <span className="text-sm text-muted-foreground">© 2023 Corteva Agriscience</span>
            </div>
            <div className="flex gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-green-600">
                Inicio
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-green-600">
                Iniciar Sesión
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-green-600">
                Términos y Condiciones
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-green-600">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
