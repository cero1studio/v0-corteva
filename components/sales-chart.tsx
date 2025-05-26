"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface SalesChartProps {
  data: any[]
}

export function SalesChart({ data }: SalesChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (data && data.length > 0) {
      // Agrupar ventas por fecha
      const groupedByDate = data.reduce((acc, sale) => {
        const date = new Date(sale.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = {
            date,
            points: 0,
            sales: 0,
          }
        }
        acc[date].points += sale.total_points || 0
        acc[date].sales += 1
        return acc
      }, {})

      // Convertir a array y ordenar por fecha
      const chartData = Object.values(groupedByDate)
        .sort((a: any, b: any) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        .slice(-7) // Últimos 7 días

      setChartData(chartData)
    }
  }, [data])

  if (!data || data.length === 0) {
    return <div className="text-center py-10">No hay datos disponibles</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
          }}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => {
            if (name === "points") return [`${value} puntos`, "Puntos"]
            return [`${value} ventas`, "Ventas"]
          }}
          labelFormatter={(label) => `Fecha: ${label}`}
        />
        <Bar dataKey="points" name="Puntos" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="sales" name="Ventas" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
