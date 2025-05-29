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
      // Agrupar ventas por semana
      const groupedByWeek = data.reduce((acc, sale) => {
        const date = new Date(sale.created_at)
        // Obtener el primer día de la semana (lunes)
        const day = date.getDay() || 7 // Convertir domingo (0) a 7
        const firstDayOfWeek = new Date(date)
        firstDayOfWeek.setDate(date.getDate() - day + 1) // Ajustar al lunes

        // Formato de semana: "DD/MM - DD/MM"
        const weekStart = firstDayOfWeek.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
        const weekEnd = new Date(firstDayOfWeek)
        weekEnd.setDate(firstDayOfWeek.getDate() + 6) // Domingo
        const weekEndStr = weekEnd.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })

        const weekKey = `${weekStart} - ${weekEndStr}`

        if (!acc[weekKey]) {
          acc[weekKey] = {
            week: weekKey,
            puntos: 0,
            ventas: 0,
          }
        }
        acc[weekKey].puntos += sale.points || 0
        acc[weekKey].ventas += 1
        return acc
      }, {})

      // Convertir a array y ordenar por fecha
      const chartData = Object.values(groupedByWeek)
        .sort((a: any, b: any) => {
          // Extraer la primera fecha de cada semana para ordenar
          const dateA = a.week.split(" - ")[0].split("/").reverse().join("-")
          const dateB = b.week.split(" - ")[0].split("/").reverse().join("-")
          return dateA.localeCompare(dateB)
        })
        .slice(-7) // Últimas 7 semanas

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
        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => {
            if (name === "puntos") return [`${value} puntos`, "Puntos"]
            return [`${value} ventas`, "Ventas"]
          }}
          labelFormatter={(label) => `Semana: ${label}`}
        />
        <Bar dataKey="puntos" name="Puntos" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="ventas" name="Ventas" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
