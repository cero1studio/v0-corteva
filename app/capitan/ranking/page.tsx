"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Medal, ShoppingCart, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  getTeamRankingByZone,
  getSalesRankingByZone,
  getClientsRankingByZone,
  getUserTeamInfo,
  getProducts,
  type TeamRanking,
  type SalesRanking,
  type ClientsRanking,
  type UserTeamInfo,
} from "@/app/actions/ranking"
import { Skeleton } from "@/components/ui/skeleton"

export default function CapitanRankingPage() {
  const { user } = useAuth()
  const [productFilter, setProductFilter] = useState("all")
  const [teamRanking, setTeamRanking] = useState<TeamRanking[]>([])
  const [salesRanking, setSalesRanking] = useState<SalesRanking[]>([])
  const [clientsRanking, setClientsRanking] = useState<ClientsRanking[]>([])
  const [userTeamInfo, setUserTeamInfo] = useState<UserTeamInfo | null>(null)
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar información del equipo del usuario (requerido)
      const userInfoResult = await getUserTeamInfo(user!.id)
      if (!userInfoResult.success) {
        throw new Error(userInfoResult.error || "Error al cargar información del equipo")
      }
      setUserTeamInfo(userInfoResult.data!)

      const userZoneId = userInfoResult.data!.zone_id

      // Cargar todos los rankings de la zona del usuario
      const [teamRankingResult, salesRankingResult, clientsRankingResult, productsResult] = await Promise.all([
        getTeamRankingByZone(userZoneId),
        getSalesRankingByZone(userZoneId),
        getClientsRankingByZone(userZoneId),
        getProducts(),
      ])

      if (teamRankingResult.success) {
        setTeamRanking(teamRankingResult.data || [])
      }

      if (salesRankingResult.success) {
        setSalesRanking(salesRankingResult.data || [])
      }

      if (clientsRankingResult.success) {
        setClientsRanking(clientsRankingResult.data || [])
      }

      if (productsResult.success) {
        setProducts(productsResult.data || [])
      }
    } catch (error) {
      console.error("Error loading ranking data:", error)
      setError(error instanceof Error ? error.message : "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={loadData} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className="text-3xl font-bold tracking-tight">Ranking {userTeamInfo?.zone_name || "General"}</h2>

        <div className="flex items-center gap-4">
          <Select defaultValue="all" value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Producto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="equipos" className="space-y-6">
        <TabsList className="h-10">
          <TabsTrigger value="equipos" className="text-sm">
            Ranking General
          </TabsTrigger>
          <TabsTrigger value="ventas" className="text-sm">
            Ranking de Ventas
          </TabsTrigger>
          <TabsTrigger value="clientes" className="text-sm">
            Ranking de Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipos" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                TOP Equipos - {userTeamInfo?.zone_name}
              </CardTitle>
              <CardDescription>Los mejores equipos de tu zona por puntos totales</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">Goles</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamRanking.map((team) => (
                    <TableRow key={team.team_id} className={team.team_id === userTeamInfo?.team_id ? "bg-blue-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {team.position}
                          {getPositionIcon(team.position) && (
                            <span className="text-lg">{getPositionIcon(team.position)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {team.team_name}
                        {team.team_id === userTeamInfo?.team_id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Tu equipo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">{team.goals}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{team.total_points}</TableCell>
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
                    <div className="text-4xl font-bold">{userTeamInfo?.position || 0}</div>
                    <p className="text-sm text-muted-foreground">Posición</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{userTeamInfo?.goals || 0}</div>
                    <p className="text-sm text-muted-foreground">Goles</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{userTeamInfo?.total_points || 0}</div>
                    <p className="text-sm text-muted-foreground">Puntos</p>
                  </div>
                  {getPositionIcon(userTeamInfo?.position || 0) && (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-500">
                        {getPositionIcon(userTeamInfo?.position || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Medalla</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Tu Equipo
                </CardTitle>
                <CardDescription>Información de tu equipo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Equipo:</span>
                    <span className="font-medium">{userTeamInfo?.team_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Zona:</span>
                    <span className="font-medium">{userTeamInfo?.zone_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posición:</span>
                    <span className="font-bold text-blue-600">#{userTeamInfo?.position}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ventas" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                Ranking de Ventas - {userTeamInfo?.zone_name}
              </CardTitle>
              <CardDescription>Los mejores equipos por volumen de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Puntos Totales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRanking.map((team) => (
                    <TableRow
                      key={team.team_id}
                      className={team.team_id === userTeamInfo?.team_id ? "bg-green-50" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {team.position}
                          {getPositionIcon(team.position) && (
                            <span className="text-lg">{getPositionIcon(team.position)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {team.team_name}
                        {team.team_id === userTeamInfo?.team_id && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Tu equipo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">{team.total_sales}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{team.total_points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Ranking de Clientes Competencia - {userTeamInfo?.zone_name}
              </CardTitle>
              <CardDescription>Los mejores equipos por clientes registrados de la competencia</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsRanking.map((team) => (
                    <TableRow
                      key={team.team_id}
                      className={team.team_id === userTeamInfo?.team_id ? "bg-purple-50" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {team.position}
                          {getPositionIcon(team.position) && (
                            <span className="text-lg">{getPositionIcon(team.position)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {team.team_name}
                        {team.team_id === userTeamInfo?.team_id && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Tu equipo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-600">{team.total_clients}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {team.total_points_from_clients}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
