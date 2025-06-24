"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BarChart3Icon } from "lucide-react"
import { Button } from "@/components/ui/button"

type TeamData = {
  name: string
  goles: number
  puntos: number
}

export function AdminStatsChart() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TeamData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar la misma query simple que funciona en el dashboard principal
      const { data: teams, error } = await supabase
        .from("teams")
        .select("name, total_points")
        .order("total_points", { ascending: false })
        .limit(20)

      if (error) throw error

      if (!teams || teams.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Formatear datos - usar 100 puntos = 1 gol como default
      const chartData = teams.map((team) => ({
        name: team.name || "Sin nombre",
        goles: Math.floor((team.total_points || 0) / 100),
        puntos: team.total_points || 0,
      }))

      setData(chartData)
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <Skeleton className="h-[400px] w-full" />

  if (error) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData} size="sm">
          Reintentar
        </Button>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center">
        <BarChart3Icon className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">No hay equipos registrados</p>
      </div>
    )
  }

  const colors = ["#f59e0b", "#4ade80", "#3b82f6", "#ec4899", "#8b5cf6"]

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
          <YAxis />
          <Tooltip formatter={(value, name) => [value, name === "goles" ? "Goles" : name]} />
          <Bar dataKey="goles" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
