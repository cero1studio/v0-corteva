"use client"

import { useEffect, useState } from "react"
import { getTeamRankingByZone } from "@/services/football"

interface TeamRanking {
  team: string
  points: number
  goals_favor: number
  goals_against: number
  goals_difference: number
}

const RankingPage = () => {
  const [rankingA, setRankingA] = useState<TeamRanking[]>([])
  const [rankingB, setRankingB] = useState<TeamRanking[]>([])

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const rankingAData = await getTeamRankingByZone("A")
        const rankingBData = await getTeamRankingByZone("B")

        setRankingA(rankingAData)
        setRankingB(rankingBData)
      } catch (error) {
        console.error("Error fetching rankings:", error)
      }
    }

    fetchRankings()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tabla de Posiciones</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Zona A</h2>
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Equipo</th>
                <th className="px-4 py-2">Puntos</th>
                <th className="px-4 py-2">GF</th>
                <th className="px-4 py-2">GC</th>
                <th className="px-4 py-2">DG</th>
              </tr>
            </thead>
            <tbody>
              {rankingA.map((team, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{team.team}</td>
                  <td className="border px-4 py-2">{team.points}</td>
                  <td className="border px-4 py-2">{team.goals_favor}</td>
                  <td className="border px-4 py-2">{team.goals_against}</td>
                  <td className="border px-4 py-2">{team.goals_difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Zona B</h2>
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Equipo</th>
                <th className="px-4 py-2">Puntos</th>
                <th className="px-4 py-2">GF</th>
                <th className="px-4 py-2">GC</th>
                <th className="px-4 py-2">DG</th>
              </tr>
            </thead>
            <tbody>
              {rankingB.map((team, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{team.team}</td>
                  <td className="border px-4 py-2">{team.points}</td>
                  <td className="border px-4 py-2">{team.goals_favor}</td>
                  <td className="border px-4 py-2">{team.goals_against}</td>
                  <td className="border px-4 py-2">{team.goals_difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RankingPage
