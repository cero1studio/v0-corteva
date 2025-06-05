"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface UserTeamInfo {
  team_name: string
  total_points: number
  user_id: string
  username: string
  goals: number
  position?: number
}

const puntosParaGol = 10

export default function RankingPage() {
  const [userTeamInfo, setUserTeamInfo] = useState<UserTeamInfo | null>(null)
  const [ranking, setRanking] = useState<UserTeamInfo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadUserTeamInfo()
    loadRanking()
  }, [])

  const loadUserTeamInfo = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: user_team_info, error } = await supabase
        .from("user_team_info")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching user team info:", error)
        setLoading(false)
        return
      }

      if (user_team_info) {
        // Calcular goles reales basados en puntos totales
        const realGoals = Math.floor(user_team_info.total_points / puntosParaGol)

        // Actualizar el objeto userTeamInfo
        setUserTeamInfo({
          ...user_team_info,
          goals: realGoals,
        })
      }
    }
    setLoading(false)
  }

  const loadRanking = async () => {
    setLoading(true)
    const { data: ranking_data, error } = await supabase
      .from("user_team_info")
      .select("*")
      .order("total_points", { ascending: false })

    if (error) {
      console.error("Error fetching ranking:", error)
      setLoading(false)
      return
    }

    if (ranking_data) {
      // Add position to each user
      const rankingWithPositions = ranking_data.map((user, index) => ({
        ...user,
        position: index + 1,
        goals: Math.floor(user.total_points / puntosParaGol), // Calculate goals for ranking display
      }))
      setRanking(rankingWithPositions)
    }
    setLoading(false)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Ranking</h1>

      {userTeamInfo && (
        <div className="mb-4 p-4 border rounded shadow-md">
          <h2 className="text-xl font-semibold mb-2">Your Team</h2>
          <p>
            Team Name: <span className="font-medium">{userTeamInfo.team_name}</span>
          </p>
          <p>
            Total Points: <span className="font-medium">{userTeamInfo.total_points}</span>
          </p>
          <p>
            Position:{" "}
            <span className="font-medium">
              {ranking.find((team) => team.user_id === userTeamInfo.user_id)?.position || "N/A"}
            </span>
          </p>
          <p>
            Goals:
            <div className="text-2xl font-bold">{Math.floor(userTeamInfo.total_points / puntosParaGol)}</div>
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Position</th>
              <th className="py-2 px-4 border-b">Username</th>
              <th className="py-2 px-4 border-b">Team Name</th>
              <th className="py-2 px-4 border-b">Total Points</th>
              <th className="py-2 px-4 border-b">Goals</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((team) => (
              <tr key={team.user_id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b text-center">{team.position}</td>
                <td className="py-2 px-4 border-b">{team.username}</td>
                <td className="py-2 px-4 border-b">{team.team_name}</td>
                <td className="py-2 px-4 border-b text-center">{team.total_points}</td>
                <td className="py-2 px-4 border-b text-center">{team.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
