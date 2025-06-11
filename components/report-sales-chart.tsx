"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BarChart3 } from "lucide-react"
import { EmptyState } from "./empty-state"

type DailySalesData = {
  name: string // e.g., "Lun", "Mar" or "2023-01-01"
  ventas: number
  goles: number
}

export function ReportSalesChart() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DailySalesData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [salesResult, puntosConfigResult] = await Promise.all([
        supabase.from("sales").select("points, created_at"),
        supabase.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle(),
      ])

      if (salesResult.error) throw salesResult.error
      if (puntosConfigResult.error) throw puntosConfigResult.error

      const sales = salesResult.data || []
      const puntosParaGol = puntosConfigResult.data?.value ? Number(puntosConfigResult.data.value) : 100

      if (sales.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      const dailyStatsMap = new Map<string, { salesCount: number; totalPoints: number }>()

      sales.forEach((sale) => {
        const date = new Date(sale.created_at)
        const dateKey = date.toISOString().split("T")[0] // YYYY-MM-DD

        const current = dailyStatsMap.get(dateKey) || { salesCount: 0, totalPoints: 0 }
        current.salesCount += 1 // Count each sale
        current.totalPoints += sale.points || 0
        dailyStatsMap.set(dateKey, current)
      })

      // Convert map to array and sort by date
      const chartData: DailySalesData[] = Array.from(dailyStatsMap.entries())
        .map(([dateKey, stats]) => ({
          name: dateKey, // Use full date for X-axis, can be formatted later
          ventas: stats.salesCount,
          goles: Math.floor(stats.totalPoints / puntosParaGol),
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())

      // Optional: If you want to show last 7 days or specific period
      // For simplicity, let's just show all data for now, or last N entries
      const last7DaysData = chartData.slice(-7) // Example: last 7 days

      setData(last7DaysData) // Or setData(chartData) for all data
    } catch (err: any) {
      console.error("Error al cargar datos del gráfico de ventas:", err)
      setError(`Error al cargar datos: ${err.message || "Desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) {
    return <div className="h-[300px] flex items-center justify-center">Cargando gráfico...</div>
  }

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar datos"
        description={error}
        actionLabel="Reintentar"
        onClick={fetchData}
        className="h-[300px]"
        iconClassName="bg-red-50"
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No hay datos de ventas"
        description="Registra ventas para ver la evolución."
        className="h-[300px]"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="ventas" name="Ventas" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="goles" name="Goles" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
