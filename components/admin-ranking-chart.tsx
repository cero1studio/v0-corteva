"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { supabase } from "@/lib/supabase/client"

const sampleData = [
  { team: "Los Campeones", points: 450, zone: "Norte" },
  { team: "Águilas FC", points: 420, zone: "Sur" },
  { team: "Tigres Unidos", points: 380, zone: "Este" },
  { team: "Leones Dorados", points: 350, zone: "Oeste" },
  { team: "Halcones", points: 320, zone: "Norte" },
]

export function AdminRankingChart() {
  const [data, setData] = useState(sampleData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankingData()
  }, [])

  async function fetchRankingData() {
    try {
      const { data: teams, error } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          zones (name),
          sales (points)
        `)
        .order("name")

      if (error) {
        console.error("Error fetching teams:", error)
        setData(sampleData)
        return
      }

      if (!teams || teams.length === 0) {
        setData(sampleData)
        return
      }

      const processedData = teams
        .map((team: any) => {
          const totalPoints = team.sales?.reduce((sum: number, sale: any) => sum + (sale.points || 0), 0) || 0
          return {
            team: team.name,
            points: totalPoints,
            zone: team.zones?.name || "Sin zona",
          }
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 10) // Top 10

      setData(processedData.length > 0 ? processedData : sampleData)
    } catch (error) {
      console.error("Error processing ranking data:", error)
      setData(sampleData)
    } finally {
      setLoading(false)
    }
  }

  const chartConfig = {
    points: {
      label: "Puntos",
      color: "hsl(var(--chart-1))",
    },
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Cargando ranking...</div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs fill-muted-foreground" />
        <YAxis type="category" dataKey="team" className="text-xs fill-muted-foreground" width={90} />
        <Tooltip
          content={<ChartTooltipContent />}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Bar dataKey="points" fill="var(--color-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
