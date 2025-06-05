"use client"

import { useState, useEffect } from "react"
import { getTeamRankingByZone } from "@/services/rankingService"
import type { Zone } from "@/types"

interface RankingItem {
  teamName: string
  zone: Zone
  points: number
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

const RankingPublicoPage = () => {
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getTeamRankingByZone()
        setRanking(data)
      } catch (err: any) {
        setError(err.message || "Error fetching ranking.")
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  if (loading) {
    return <div>Loading ranking...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h1>Public Ranking</h1>
      <table>
        <thead>
          <tr>
            <th>Team Name</th>
            <th>Zone</th>
            <th>Points</th>
            <th>Matches Played</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Draws</th>
            <th>Goals For</th>
            <th>Goals Against</th>
            <th>Goal Difference</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((item, index) => (
            <tr key={index}>
              <td>{item.teamName}</td>
              <td>{item.zone}</td>
              <td>{item.points}</td>
              <td>{item.matchesPlayed}</td>
              <td>{item.wins}</td>
              <td>{item.losses}</td>
              <td>{item.draws}</td>
              <td>{item.goalsFor}</td>
              <td>{item.goalsAgainst}</td>
              <td>{item.goalDifference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RankingPublicoPage
