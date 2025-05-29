"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { supabase } from "@/lib/supabase/client"

// Datos de ejemplo para cuando no hay datos reales
const sampleData = [
  { week: "Sem 1", equipoA: 12, equipoB: 8, equipoC: 15 },
  { week: "Sem 2", equipoA: 19, equipoB: 12, equipoC: 18 },
  { week: "Sem 3", equipoA: 25, equipoB: 20, equipoC: 22 },
  { week: "Sem 4", equipoA: 32, equipoB: 28, equipoC: 30 },
  { week: "Sem 5", equipoA: 38, equipoB: 35, equipoC: 36 },
  { week: "Sem 6", equipoA: 45, equipoB: 42, equipoC: 44 },
]

export function AdminStatsChart() {
  const [data, setData] = useState(sampleData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [])

  async function fetchChartData() {
    try {
      // Intentar obtener datos reales de ventas
      const { data: salesData, error } = await supabase
        .from("sales")
        .select(`
          created_at,
          points,
          teams (
            name
          )
        `)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching sales data:", error)
        setData(sampleData)
        return
      }

      if (!salesData || salesData.length === 0) {
        setData(sampleData)
        return
      }

      // Procesar datos reales si existen
      const processedData = processSalesData(salesData)
      setData(processedData.length > 0 ? processedData : sampleData)
    } catch (error) {
      console.error("Error processing chart data:", error)
      setData(sampleData)
    } finally {
      setLoading(false)
    }
  }

  function processSalesData(salesData: any[]) {
    // Agrupar por semana y equipo
    const weeklyData: Record<string, Record<string, number>> = {}

    salesData.forEach((sale) => {
      const date = new Date(sale.created_at)
      const week = `Sem ${Math.ceil(date.getDate() / 7)}`
      const teamName = sale.teams?.name || "Equipo"

      if (!weeklyData[week]) {
        weeklyData[week] = {}
      }

      if (!weeklyData[week][teamName]) {
        weeklyData[week][teamName] = 0
      }

      weeklyData[week][teamName] += sale.points || 0
    })

    // Convertir a formato de chart
    return Object.entries(weeklyData).map(([week, teams]) => ({
      week,
      ...teams,
    }))
  }

  const chartConfig = {
    equipoA: {
      label: "Equipo A",
      color: "hsl(var(--chart-1))",
    },
    equipoB: {
      label: "Equipo B",
      color: "hsl(var(--chart-2))",
    },
    equipoC: {
      label: "Equipo C",
      color: "hsl(var(--chart-3))",
    },
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Cargando gráfico...</div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="week" className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          content={<ChartTooltipContent />}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="equipoA"
          stroke="var(--color-1)"
          strokeWidth={2}
          dot={{ fill: "var(--color-1)", strokeWidth: 2, r: 4 }}
          name="Equipo A"
        />
        <Line
          type="monotone"
          dataKey="equipoB"
          stroke="var(--color-2)"
          strokeWidth={2}
          dot={{ fill: "var(--color-2)", strokeWidth: 2, r: 4 }}
          name="Equipo B"
        />
        <Line
          type="monotone"
          dataKey="equipoC"
          stroke="var(--color-3)"
          strokeWidth={2}
          dot={{ fill: "var(--color-3)", strokeWidth: 2, r: 4 }}
          name="Equipo C"
        />
      </LineChart>
    </ChartContainer>
  )
}
