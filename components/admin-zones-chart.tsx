"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, MapPin } from "lucide-react"
import { Button } from "./ui/button"

type ZoneData = {
  name: string
  goles: number
  equipos: number
}

export function AdminZonesChart() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ZoneData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Primero obtener todas las zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name")

      if (zonesError) throw zonesError

      if (!zones || zones.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Para cada zona, contar equipos y sumar puntos
      const zoneStats = []
      for (const zone of zones) {
        const { data: teams } = await supabase.from("teams").select("total_points").eq("zone_id", zone.id)

        const totalPuntos = teams?.reduce((sum, team) => sum + (team.total_points || 0), 0) || 0
        const goles = Math.floor(totalPuntos / 100)

        zoneStats.push({
          name: zone.name,
          goles: goles,
          equipos: teams?.length || 0,
        })
      }

      // Ordenar por goles
      zoneStats.sort((a, b) => b.goles - a.goles)
      setData(zoneStats)
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
        <MapPin className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">No hay zonas registradas</p>
      </div>
    )
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={70} />
          <Tooltip formatter={(value) => [value, "Goles"]} />
          <Bar dataKey="goles" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
