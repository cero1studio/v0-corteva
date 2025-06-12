"use client"

import { getAdminStats, getRecentSales, getTopTeams } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentSales, setRecentSales] = useState<any>(null)
  const [topTeams, setTopTeams] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = () => {
    setError(null)
    setRetryCount((prev) => prev + 1)
    // Trigger re-fetch
  }

  useEffect(() => {
    let mounted = true
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        setError("La carga está tardando mucho. Intenta recargar la página.")
        setIsLoading(false)
      }
    }, 5000) // 5 segundos timeout

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [statsResult, salesResult, teamsResult] = await Promise.allSettled([
          getAdminStats(),
          getRecentSales(),
          getTopTeams(),
        ])

        if (mounted) {
          if (statsResult.status === "fulfilled") {
            setStats(statsResult.value)
          } else {
            console.error("Error fetching stats:", statsResult.reason)
          }

          if (salesResult.status === "fulfilled") {
            setRecentSales(salesResult.value)
          } else {
            console.error("Error fetching sales:", salesResult.reason)
          }

          if (teamsResult.status === "fulfilled") {
            setTopTeams(teamsResult.value)
          } else {
            console.error("Error fetching teams:", teamsResult.reason)
          }
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError("Error al cargar los datos")
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [retryCount])

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {error && (
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={handleRetry}>Reintentar</Button>
        </div>
      )}
      {stats && (
        <div>
          <h2>Stats</h2>
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
      {recentSales && (
        <div>
          <h2>Recent Sales</h2>
          <pre>{JSON.stringify(recentSales, null, 2)}</pre>
        </div>
      )}
      {topTeams && (
        <div>
          <h2>Top Teams</h2>
          <pre>{JSON.stringify(topTeams, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
