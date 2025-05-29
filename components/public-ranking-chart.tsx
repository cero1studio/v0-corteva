"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { supabase } from "@/lib/supabase/client"

const sampleData = [
  { position: 1, team: "Los Campeones", points: 450, zone: "Norte" },
  { position: 2, team: "Águilas FC", points: 420, zone: "Sur" },
  { position: 3, team: "Tigres Unidos", points: 380, zone: "Este" },
  { position: 4, team: "Leones Dorados", points: 350, zone: "Oeste" },
  { position: 5, team: "Halcones", points: 320, zone: "Norte" },
]

export function PublicRankingChart() {
  const [data, setData] = useState(sampleData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicRanking()
  }, [])

  async function fetchPublicRanking() {
    try {
      const { data: teams, error } = await supabase.from("teams").select(`
          id,
          name,
          zones (name),
          sales (points)
        `)

      if (error) {
        console.error("Error fetching public ranking:", error)
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
        .slice(0, 10)
        .map((team, index) => ({
          position: index + 1,
          ...team,
        }))

      setData(processedData.length > 0 ? processedData : sampleData)
    } catch (error) {
      console.error("Error processing public ranking:", error)
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
        <div className="text-muted-foreground">Cargando ranking público...</div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="team" className="text-xs fill-muted-foreground" angle={-45} textAnchor="end" height={80} />
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
        <Bar dataKey="points" fill="var(--color-1)" name="Puntos" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
