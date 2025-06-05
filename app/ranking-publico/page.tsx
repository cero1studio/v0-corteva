"use client"

import { useEffect, useState } from "react"

interface Team {
  id: number
  name: string
  total_points: number
  goals: number
}

const puntosParaGol = 3

export default function RankingPublico() {
  const [ranking, setRanking] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ranking")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const ranking: Team[] = data.ranking

      // Recalcular goles basados en puntos totales reales
      const correctedRanking = ranking.map((team) => ({
        ...team,
        goals: Math.floor(team.total_points / puntosParaGol),
      }))

      setRanking(correctedRanking)
    } catch (e: any) {
      setError(e.message)
      console.error("Failed to load ranking:", e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Cargando ranking...</div>
  }

  if (error) {
    return <div>Error al cargar el ranking: {error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ranking Público</h1>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Posición</th>
            <th className="px-4 py-2">Equipo</th>
            <th className="px-4 py-2">Puntos</th>
            <th className="px-4 py-2">Goles</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((team, index) => (
            <tr key={team.id} className={index % 2 === 0 ? "bg-gray-100" : ""}>
              <td className="border px-4 py-2">{index + 1}</td>
              <td className="border px-4 py-2">{team.name}</td>
              <td className="border px-4 py-2">{team.total_points}</td>
              <td className="border px-4 py-2">
                <div className="text-xl font-bold">{Math.floor(team.total_points / puntosParaGol)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
