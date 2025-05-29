"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { supabase } from "@/lib/supabase/client"

const sampleData = [
  { zone: "Norte", teams: 8, points: 245 },
  { zone: "Sur", teams: 6, points: 198 },
  { zone: "Este", teams: 7, points: 220 },
  { zone: "Oeste", teams: 5, points: 165 },
]

export function AdminZonesChart() {
  const [data, setData] = useState(sampleData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchZoneData()
  }, [])

  async function fetchZoneData() {
    try {
      const { data: zones, error } = await supabase.from("zones").select(`
          id,
          name,
          teams (
            id,
            sales (
              points
            )
          )
        `)

      if (error) {
        console.error("Error fetching zones:", error)
        setData(sampleData)
        return
      }

      if (!zones || zones.length === 0) {
        setData(sampleData)
        return
      }

      const processedData = zones.map((zone: any) => {
        const teams = zone.teams || []
        const totalPoints = teams.reduce((sum: number, team: any) => {
          const teamPoints = team.sales?.reduce((teamSum: number, sale: any) => teamSum + (sale.points || 0), 0) || 0
          return sum + teamPoints
        }, 0)

        return {
          zone: zone.name,
          teams: teams.length,
          points: totalPoints,
        }
      })

      setData(processedData.length > 0 ? processedData : sampleData)
    } catch (error) {
      console.error("Error processing zone data:", error)
      setData(sampleData)
    } finally {
      setLoading(false)
    }
  }

  const chartConfig = {
    teams: {
      label: "Equipos",
      color: "hsl(var(--chart-1))",
    },
    points: {
      label: "Puntos",
      color: "hsl(var(--chart-2))",
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
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="zone" className="text-xs fill-muted-foreground" />
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
        <Bar dataKey="teams" fill="var(--color-1)" name="Equipos" radius={[4, 4, 0, 0]} />
        <Bar dataKey="points" fill="var(--color-2)" name="Puntos" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
