import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Trophy, Search, Download, MapPin } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/empty-state"
import { Input } from "@/components/ui/input"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTeamRankingByZone } from "@/app/actions/ranking"

// Componente para cargar datos del ranking
async function NationalRanking() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Obtener ranking nacional usando la función actualizada
    const rankingResult = await getTeamRankingByZone()

    if (!rankingResult.success || !rankingResult.data || rankingResult.data.length === 0) {
      return (
        <EmptyState
          icon={Trophy}
          title="No hay datos de ranking"
          description="Aún no hay equipos con ventas registradas para generar un ranking."
          actionLabel="Crear equipos"
          actionHref="/admin/equipos/nuevo"
        />
      )
    }

    const teams = rankingResult.data

    // Función para obtener la URL del logo del distribuidor
    const getDistributorLogo = (distributorName: string) => {
      if (!distributorName) return null

      const normalizedName = distributorName.toLowerCase()

      if (normalizedName.includes("agralba")) {
        return "/logos/agralba.png"
      } else if (normalizedName.includes("coacosta")) {
        return "/logos/coacosta.png"
      } else if (normalizedName.includes("hernandez")) {
        return "/logos/hernandez.png"
      } else if (normalizedName.includes("insagrin")) {
        return "/logos/insagrin.png"
      } else if (normalizedName.includes("cosechar")) {
        return "/logos/cosechar.png"
      }

      return null
    }

    return (
      <div className="space-y-6">
        <div className="rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribuidor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.map((team, index) => (
                <tr key={team.team_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">{team.position}</span>
                      {team.position === 1 && <span className="text-xl">🥇</span>}
                      {team.position === 2 && <span className="text-xl">🥈</span>}
                      {team.position === 3 && <span className="text-xl">🥉</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={getDistributorLogo(team.distributor_name) || "/placeholder.svg"}
                        alt=""
                        className="h-8 w-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{team.zone_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-green-600">{team.goals}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-500">{team.total_points.toLocaleString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error al obtener el ranking nacional:", error)
    return (
      <div className="rounded-md bg-red-50 p-4 text-center text-sm text-red-500">
        Error al cargar el ranking nacional. Por favor, inténtelo de nuevo.
      </div>
    )
  }
}

// Componente para cargar datos de zonas
async function ZoneRanking() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Obtener usuario actual
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return (
        <EmptyState
          icon={MapPin}
          title="Inicia sesión para ver ranking por zona"
          description="Necesitas iniciar sesión para ver el ranking específico de tu zona."
        />
      )
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("zone_id, team_id")
      .eq("id", session.user.id)
      .single()

    if (!profile || !profile.zone_id) {
      return (
        <EmptyState
          icon={MapPin}
          title="No tienes una zona asignada"
          description="Contacta a un administrador para que te asigne a una zona."
        />
      )
    }

    // Obtener información de la zona
    const { data: zone } = await supabase.from("zones").select("name").eq("id", profile.zone_id).single()

    // Obtener ranking de la zona usando la función actualizada
    const rankingResult = await getTeamRankingByZone(profile.zone_id)

    if (!rankingResult.success || !rankingResult.data || rankingResult.data.length === 0) {
      return (
        <EmptyState
          icon={Trophy}
          title={`No hay equipos en ${zone?.name || "tu zona"}`}
          description="Aún no hay equipos registrados en esta zona."
        />
      )
    }

    const teams = rankingResult.data

    // Función para obtener la URL del logo del distribuidor
    const getDistributorLogo = (distributorName: string) => {
      if (!distributorName) return null

      const normalizedName = distributorName.toLowerCase()

      if (normalizedName.includes("agralba")) {
        return "/logos/agralba.png"
      } else if (normalizedName.includes("coacosta")) {
        return "/logos/coacosta.png"
      } else if (normalizedName.includes("hernandez")) {
        return "/logos/hernandez.png"
      } else if (normalizedName.includes("insagrin")) {
        return "/logos/insagrin.png"
      } else if (normalizedName.includes("cosechar")) {
        return "/logos/cosechar.png"
      }

      return null
    }

    // Encontrar la posición del equipo del usuario
    const userTeam = teams.find((team) => team.team_id === profile.team_id)
    const userTeamPosition = userTeam?.position || 0

    // Calcular próximo objetivo
    let nextGoal = 100
    let nextMedal = "🥉"

    if (userTeamPosition > 1 && userTeamPosition <= teams.length) {
      const currentTeam = teams.find((t) => t.position === userTeamPosition)
      const nextTeam = teams.find((t) => t.position === userTeamPosition - 1)

      if (currentTeam && nextTeam) {
        // Obtener configuración de puntos para gol
        const { data: puntosConfig } = await supabase
          .from("system_config")
          .select("value")
          .eq("key", "puntos_para_gol")
          .maybeSingle()

        const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100
        nextGoal = Math.max(1, Math.ceil((nextTeam.total_points - currentTeam.total_points + 1) / puntosParaGol))
      }

      nextMedal = userTeamPosition === 2 ? "🥇" : userTeamPosition === 3 ? "🥈" : "🥉"
    } else if (userTeamPosition === 1) {
      nextGoal = 0
      nextMedal = "🥇"
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          Ranking de {zone?.name || "tu zona"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {profile.team_id && userTeam && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Tu Posición
                  </CardTitle>
                  <CardDescription>Tu posición actual en el ranking</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-7xl font-bold">{userTeamPosition || "-"}</div>
                  <div className="text-5xl font-bold text-green-600">{userTeam.goals}</div>
                  <div className="text-4xl">
                    {userTeamPosition === 1 && "🥇"}
                    {userTeamPosition === 2 && "🥈"}
                    {userTeamPosition === 3 && "🥉"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Próximo Objetivo
                  </CardTitle>
                  <CardDescription>Lo que necesitas para subir de posición</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-7xl font-bold">{nextGoal}</div>
                  <div className="text-xl">Goles necesarios</div>
                  <div className="text-4xl">{nextMedal}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribuidor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.map((team) => {
                const isUserTeam = team.team_id === profile.team_id

                return (
                  <tr key={team.team_id} className={isUserTeam ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{team.position}</span>
                        {team.position === 1 && <span className="text-xl">🥇</span>}
                        {team.position === 2 && <span className="text-xl">🥈</span>}
                        {team.position === 3 && <span className="text-xl">🥉</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={getDistributorLogo(team.distributor_name) || "/placeholder.svg"}
                          alt=""
                          className="h-8 w-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-green-600">{team.goals}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-500">{team.total_points.toLocaleString()}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error al obtener el ranking por zona:", error)
    return (
      <div className="rounded-md bg-red-50 p-4 text-center text-sm text-red-500">
        Error al cargar el ranking por zona. Por favor, inténtelo de nuevo.
      </div>
    )
  }
}

// Componente para cargar datos de distribuidores
async function DistributorRanking() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Obtener ranking de distribuidores
    const { data: distributors, error } = await supabase.rpc("get_distributor_ranking")

    if (error) throw error

    if (!distributors || distributors.length === 0) {
      return (
        <EmptyState
          icon={Trophy}
          title="No hay datos de distribuidores"
          description="Aún no hay suficientes datos para generar un ranking de distribuidores."
        />
      )
    }

    // Función para obtener la URL del logo del distribuidor
    const getDistributorLogo = (name: string) => {
      if (!name) return null

      const normalizedName = name.toLowerCase()

      if (normalizedName.includes("agralba")) {
        return "/logos/agralba.png"
      } else if (normalizedName.includes("coacosta")) {
        return "/logos/coacosta.png"
      } else if (normalizedName.includes("hernandez")) {
        return "/logos/hernandez.png"
      } else if (normalizedName.includes("insagrin")) {
        return "/logos/insagrin.png"
      } else if (normalizedName.includes("cosechar")) {
        return "/logos/cosechar.png"
      }

      return null
    }

    return (
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distribuidor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipos
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Goles Totales
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {distributors.map((distributor, index) => (
              <tr key={distributor.distributor_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{index + 1}</span>
                    {index === 0 && <span className="text-xl">🥇</span>}
                    {index === 1 && <span className="text-xl">🥈</span>}
                    {index === 2 && <span className="text-xl">🥉</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={getDistributorLogo(distributor.distributor_name) || "/placeholder.svg"}
                      alt=""
                      className="h-8 w-auto mr-3"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{distributor.team_count}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-green-600">{distributor.total_goals}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  } catch (error) {
    console.error("Error al obtener el ranking de distribuidores:", error)
    return (
      <div className="rounded-md bg-red-50 p-4 text-center text-sm text-red-500">
        Error al cargar el ranking de distribuidores. Por favor, inténtelo de nuevo.
      </div>
    )
  }
}

export default function RankingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ranking del Concurso</h1>
          <p className="text-muted-foreground">Visualiza el ranking de equipos y distribuidores</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Ranking
        </Button>
      </div>

      <Tabs defaultValue="nacional" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nacional">Ranking Nacional</TabsTrigger>
          <TabsTrigger value="zona">Ranking por Zona</TabsTrigger>
          <TabsTrigger value="distribuidores">Ranking Distribuidores</TabsTrigger>
        </TabsList>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar equipo..."
            className="w-full appearance-none bg-background pl-8 shadow-none md:w-[300px]"
          />
        </div>

        <TabsContent value="nacional" className="border rounded-lg p-4">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking Nacional
            </h2>
            <p className="text-sm text-muted-foreground">Clasificación general de todos los equipos</p>
          </div>
          <Suspense fallback={<div className="py-8 text-center">Cargando ranking nacional...</div>}>
            <NationalRanking />
          </Suspense>
        </TabsContent>

        <TabsContent value="zona" className="border rounded-lg p-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Ranking por Zona</h2>
            <p className="text-sm text-muted-foreground">Clasificación de equipos por zona</p>
          </div>
          <Suspense fallback={<div className="py-8 text-center">Cargando ranking por zona...</div>}>
            <ZoneRanking />
          </Suspense>
        </TabsContent>

        <TabsContent value="distribuidores" className="border rounded-lg p-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Ranking de Distribuidores</h2>
            <p className="text-sm text-muted-foreground">Clasificación de distribuidores por goles totales</p>
          </div>
          <Suspense fallback={<div className="py-8 text-center">Cargando ranking de distribuidores...</div>}>
            <DistributorRanking />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
