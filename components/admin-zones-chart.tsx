"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { MapPin } from "lucide-react"
import { EmptyState } from "./empty-state"

interface ZoneData {
  name: string
  total_goals: number // Cambiado de 'goles' a 'total_goals'
  total_points: number
}

type AdminZonesChartProps = {
  zonesData: ZoneData[] // Ahora esperamos que los datos de zonas vengan como prop
}

export function AdminZonesChart({ zonesData }: AdminZonesChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-[400px] flex items-center justify-center">Cargando gráfico...</div>
  }

  if (!zonesData || zonesData.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No hay datos de zonas disponibles"
        description="Asegúrate de que haya zonas con equipos y goles registrados."
        className="h-[400px]"
      />
    )
  }

  // Los datos de zonas ya vienen pre-filtrados (ej. top 2) desde el componente padre
  const chartData = zonesData.map((zone) => ({
    name: zone.name,
    total_goals: zone.total_goals, // Cambiado de 'goles' a 'total_goals'
    total_points: zone.total_points,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value, name, props) => {
            if (name === "Goles Totales") {
              return [`${value} goles`, "Goles Totales"]
            }
            // Asegúrate de que 'props.payload.total_points' exista si quieres mostrarlo
            return [`${props.payload?.total_points || 0} puntos`, "Puntos Totales"]
          }}
          labelFormatter={(label) => `Zona: ${label}`}
        />
        <Bar dataKey="total_goals" name="Goles Totales" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  )
}
