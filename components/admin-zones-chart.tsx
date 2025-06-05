"use client"

import { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { supabase } from "@/lib/supabase/client"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface AdminZonesChartProps {
  data?: any[]
}

export function AdminZonesChart({ data = [] }: AdminZonesChartProps) {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [data])

  async function loadChartData() {
    try {
      setLoading(true)

      // Obtener todas las zonas
      const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name").order("name")

      if (zonesError) throw zonesError

      // Obtener todos los equipos con sus zonas
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id, 
          name, 
          zone_id,
          zones:zone_id(id, name)
        `)
        .order("name")

      if (teamsError) throw teamsError

      // Obtener todas las ventas
      const { data: sales, error: salesError } = await supabase.from("sales").select(`
          id, 
          points, 
          representative_id,
          profiles:representative_id(
            id, 
            team_id,
            teams:team_id(id, name, zone_id)
          )
        `)

      if (salesError) throw salesError

      // Obtener todos los clientes registrados
      const { data: clients, error: clientsError } = await supabase.from("competitor_clients").select(`
          id, 
          representative_id,
          profiles:representative_id(
            id, 
            team_id,
            teams:team_id(id, name, zone_id)
          )
        `)

      if (clientsError) throw clientsError

      // Obtener todos los tiros libres
      const { data: freeKicks, error: freeKicksError } = await supabase.from("free_kick_goals").select(`
          id, 
          points,
          team_id,
          teams:team_id(id, name, zone_id)
        `)

      if (freeKicksError) throw freeKicksError

      // Calcular goles por zona
      const zoneGoals = {}

      // Inicializar todas las zonas con 0 goles
      zones.forEach((zone) => {
        zoneGoals[zone.id] = {
          name: zone.name,
          goals: 0,
        }
      })

      // Calcular puntos de ventas por zona
      sales.forEach((sale) => {
        if (!sale.profiles?.teams?.zone_id || !sale.points) return

        const zoneId = sale.profiles.teams.zone_id
        if (!zoneGoals[zoneId]) return

        // Acumular puntos (100 puntos = 1 gol)
        zoneGoals[zoneId].goals += sale.points / 100
      })

      // Calcular puntos de clientes por zona (200 puntos = 2 goles por cliente)
      clients.forEach((client) => {
        if (!client.profiles?.teams?.zone_id) return

        const zoneId = client.profiles.teams.zone_id
        if (!zoneGoals[zoneId]) return

        // 200 puntos = 2 goles por cliente
        zoneGoals[zoneId].goals += 2
      })

      // Calcular puntos de tiros libres por zona
      freeKicks.forEach((kick) => {
        if (!kick.teams?.zone_id || !kick.points) return

        const zoneId = kick.teams.zone_id
        if (!zoneGoals[zoneId]) return

        // Acumular puntos (100 puntos = 1 gol)
        zoneGoals[zoneId].goals += kick.points / 100
      })

      // Convertir a formato para Chart.js
      const labels = Object.values(zoneGoals).map((zone: any) => zone.name)
      const goalsData = Object.values(zoneGoals).map((zone: any) => Math.floor(zone.goals))

      setChartData({
        labels,
        datasets: [
          {
            label: "Goles",
            data: goalsData,
            backgroundColor: "rgba(75, 192, 192, 0.8)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      })
    } catch (error) {
      console.error("Error al cargar datos del gráfico:", error)
    } finally {
      setLoading(false)
    }
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `${value} ${value === 1 ? "gol" : "goles"}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        },
        title: {
          display: true,
          text: "Goles",
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
      </div>
    )
  }

  if (chartData.datasets[0]?.data.every((value) => value === 0)) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico.</p>
        <p className="text-sm text-muted-foreground">Registra ventas y clientes para ver el rendimiento por zonas.</p>
      </div>
    )
  }

  return <Bar options={options} data={chartData} />
}
