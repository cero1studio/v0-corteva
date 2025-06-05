"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTeamRankingByZone, getSalesRankingByZone, getClientsRankingByZone } from "@/app/actions/ranking"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/hooks/use-auth"

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [generalRanking, setGeneralRanking] = useState([])
  const [salesRanking, setSalesRanking] = useState([])
  const [clientsRanking, setClientsRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [userTeam, setUserTeam] = useState(null)
  const [zoneName, setZoneName] = useState("")
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      loadUserTeam()
      loadRankings()
    }
  }, [user])

  const loadUserTeam = async () => {
    try {
      // Obtener el equipo del usuario
      const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single()

      if (profile?.team_id) {
        const { data: team } = await supabase
          .from("teams")
          .select("id, name, zone_id, zones(name)")
          .eq("id", profile.team_id)
          .single()

        if (team) {
          setUserTeam(team)
          setZoneName(team.zones?.name || "")
        }
      }
    } catch (error) {
      console.error("Error loading user team:", error)
    }
  }

  const loadRankings = async () => {
    setLoading(true)
    try {
      // Obtener el perfil del usuario para saber su zona
      const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single()

      if (profile?.team_id) {
        const { data: team } = await supabase.from("teams").select("zone_id").eq("id", profile.team_id).single()

        if (team?.zone_id) {
          // Cargar rankings de la zona del usuario
          const generalResult = await getTeamRankingByZone(team.zone_id)
          const salesResult = await getSalesRankingByZone(team.zone_id)
          const clientsResult = await getClientsRankingByZone(team.zone_id)

          if (generalResult.success) setGeneralRanking(generalResult.data)
          if (salesResult.success) setSalesRanking(salesResult.data)
          if (clientsResult.success) setClientsRanking(clientsResult.data)
        }
      }
    } catch (error) {
      console.error("Error loading rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value) => {
    setActiveTab(value)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ranking {zoneName}</h1>

      <Tabs defaultValue="general" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general">Ranking General</TabsTrigger>
          <TabsTrigger value="sales">Ranking de Ventas</TabsTrigger>
          <TabsTrigger value="clients">Ranking de Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Pos.</th>
                  <th className="py-3 px-6 text-left">Equipo</th>
                  <th className="py-3 px-6 text-center">Goles</th>
                  <th className="py-3 px-6 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {generalRanking.map((team) => (
                  <tr
                    key={team.team_id}
                    className={`border-b hover:bg-gray-50 ${
                      userTeam && team.team_id === userTeam.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`${
                            team.position === 1
                              ? "bg-yellow-500"
                              : team.position === 2
                                ? "bg-gray-400"
                                : team.position === 3
                                  ? "bg-amber-700"
                                  : "bg-blue-500"
                          } text-white rounded-full w-8 h-8 flex items-center justify-center mr-2`}
                        >
                          {team.position}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {team.distributor_logo && (
                            <img
                              src={team.distributor_logo || "/placeholder.svg"}
                              alt={team.distributor_name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                        </div>
                        <span>
                          {team.team_name}
                          {userTeam && team.team_id === userTeam.id && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Tu equipo
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className="bg-green-100 text-green-800 text-lg font-medium px-2.5 py-0.5 rounded">
                        {team.goals}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className="text-blue-600 font-bold">{team.total_points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Pos.</th>
                  <th className="py-3 px-6 text-left">Equipo</th>
                  <th className="py-3 px-6 text-center">Ventas</th>
                  <th className="py-3 px-6 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {salesRanking.map((team) => (
                  <tr
                    key={team.team_id}
                    className={`border-b hover:bg-gray-50 ${
                      userTeam && team.team_id === userTeam.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`${
                            team.position === 1
                              ? "bg-yellow-500"
                              : team.position === 2
                                ? "bg-gray-400"
                                : team.position === 3
                                  ? "bg-amber-700"
                                  : "bg-blue-500"
                          } text-white rounded-full w-8 h-8 flex items-center justify-center mr-2`}
                        >
                          {team.position}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        <span>
                          {team.team_name}
                          {userTeam && team.team_id === userTeam.id && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Tu equipo
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">{team.total_sales}</td>
                    <td className="py-3 px-6 text-right">
                      <span className="text-blue-600 font-bold">{team.total_points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Pos.</th>
                  <th className="py-3 px-6 text-left">Equipo</th>
                  <th className="py-3 px-6 text-center">Clientes</th>
                  <th className="py-3 px-6 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {clientsRanking.map((team) => (
                  <tr
                    key={team.team_id}
                    className={`border-b hover:bg-gray-50 ${
                      userTeam && team.team_id === userTeam.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`${
                            team.position === 1
                              ? "bg-yellow-500"
                              : team.position === 2
                                ? "bg-gray-400"
                                : team.position === 3
                                  ? "bg-amber-700"
                                  : "bg-blue-500"
                          } text-white rounded-full w-8 h-8 flex items-center justify-center mr-2`}
                        >
                          {team.position}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        <span>
                          {team.team_name}
                          {userTeam && team.team_id === userTeam.id && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Tu equipo
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">{team.total_clients}</td>
                    <td className="py-3 px-6 text-right">
                      <span className="text-blue-600 font-bold">{team.total_points_from_clients}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
