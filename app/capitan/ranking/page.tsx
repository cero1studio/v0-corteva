"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Medal, Building } from "lucide-react"

// Sample data for rankings - Zona Norte only for captain view
const zoneRanking = {
  norte: [
    {
      position: 1,
      team: "Los Campeones",
      distributor_name: "Distribuidor Norte",
      distributor_logo: "distribuidor-norte.png",
      goals: 342,
      icon: "🥇",
    },
    {
      position: 2,
      team: "Equipo Estrella",
      distributor_name: "Distribuidor Norte",
      distributor_logo: "distribuidor-norte.png",
      goals: 243,
      icon: "🥈",
    },
    {
      position: 3,
      team: "Los Guerreros",
      distributor_name: "Agro Servicios",
      distributor_logo: "agro-servicios.png",
      goals: 198,
      icon: "🥉",
    },
    {
      position: 4,
      team: "Equipo Fuerte",
      distributor_name: "Distribuidor Norte",
      distributor_logo: "distribuidor-norte.png",
      goals: 176,
      icon: "",
    },
    {
      position: 5,
      team: "Los Tigres",
      distributor_name: "Distribuidor Norte",
      distributor_logo: "distribuidor-norte.png",
      goals: 154,
      icon: "",
    },
  ],
}

// Distributor rankings for Zona Norte
const distributorRankings = {
  norte: [
    { position: 1, distributor: "Distribuidor Norte", teams: 4, goals: 915, icon: "🥇" },
    { position: 2, distributor: "Agro Servicios", teams: 1, goals: 198, icon: "🥈" },
  ],
}

export default function CapitanRankingPage() {
  const [productFilter, setProductFilter] = useState("all")
  const [distributorFilter, setDistributorFilter] = useState("distribuidor-norte")

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className="text-3xl font-bold tracking-tight">Ranking Zona Norte</h2>

        <div className="flex items-center gap-4">
          <Select defaultValue="all" value={productFilter} onValueChange={setProductFilter}>
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

          <Select defaultValue="distribuidor-norte" value={distributorFilter} onValueChange={setDistributorFilter}>
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
              <SelectItem value="agro-servicios" className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 overflow-hidden rounded-full">
                    <img
                      src="/abstract-geometric-as.png"
                      alt="Logo Agro Servicios"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span>Agro Servicios</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="equipos" className="space-y-6">
        <TabsList className="h-10">
          <TabsTrigger value="equipos" className="text-sm">
            Ranking de Equipos
          </TabsTrigger>
          <TabsTrigger value="distribuidores" className="text-sm">
            Ranking de Distribuidores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipos" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                TOP 5 Equipos - Zona Norte
              </CardTitle>
              <CardDescription>Los mejores equipos de tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Distribuidor</TableHead>
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
                      <TableCell className="flex items-center">
                        {team.distributor_logo && (
                          <img
                            src={`/logos/${team.distributor_logo}`}
                            alt={team.distributor_name}
                            className="h-4 w-auto mr-1"
                          />
                        )}
                        {team.distributor_name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">{team.goals}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-yellow-500" />
                  Tu Posición
                </CardTitle>
                <CardDescription>Tu posición actual en el ranking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">2</div>
                    <p className="text-sm text-muted-foreground">Posición</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">243</div>
                    <p className="text-sm text-muted-foreground">Goles</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-500">🥈</div>
                    <p className="text-sm text-muted-foreground">Medalla</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Próximo Objetivo
                </CardTitle>
                <CardDescription>Lo que necesitas para subir de posición</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">100</div>
                    <p className="text-sm text-muted-foreground">Goles necesarios</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-500">🥇</div>
                    <p className="text-sm text-muted-foreground">Próxima medalla</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribuidores" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-yellow-500" />
                Ranking de Distribuidores - Zona Norte
              </CardTitle>
              <CardDescription>Los mejores distribuidores de tu zona</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead>Equipos</TableHead>
                    <TableHead className="text-right">Goles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributorRankings.norte.map((distributor) => (
                    <TableRow key={distributor.position}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {distributor.position}
                          {distributor.icon && <span className="text-lg">{distributor.icon}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{distributor.distributor}</TableCell>
                      <TableCell>{distributor.teams}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{distributor.goals}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-yellow-500" />
                Tu Distribuidor
              </CardTitle>
              <CardDescription>Información de tu distribuidor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <img
                    src="/dna-double-helix.png"
                    alt="Logo Distribuidor Norte"
                    className="mx-auto h-20 w-20 rounded-full border-4 border-yellow-400"
                  />
                  <h3 className="mt-2 text-xl font-bold">Distribuidor Norte</h3>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">1</div>
                  <p className="text-sm text-muted-foreground">Posición</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">915</div>
                  <p className="text-sm text-muted-foreground">Goles totales</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">4</div>
                  <p className="text-sm text-muted-foreground">Equipos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
