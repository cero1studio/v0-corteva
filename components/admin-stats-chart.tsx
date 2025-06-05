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

interface AdminStatsChartProps {
  data?: any[]
}

export function AdminStatsChart({ data = [] }: AdminStatsChartProps) {
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

      // Obtener todos los equipos
      const { data: teams, error: teamsError } = await supabase.from("teams").select("id, name, zone_id").order("name")

      if (teamsError) throw teamsError

      // Obtener todas las ventas
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(`
          id, 
          points, 
          created_at, 
          representative_id,
          profiles:representative_id(
            id, 
            team_id,
            teams:team_id(id, name)
          )
        `)
        .order("created_at")

      if (salesError) throw salesError

      // Obtener todos los clientes registrados
      const { data: clients, error: clientsError } = await supabase
        .from("competitor_clients")
        .select(`
          id, 
          created_at, 
          representative_id,
          profiles:representative_id(
            id, 
            team_id,
            teams:team_id(id, name)
          )
        `)
        .order("created_at")

      if (clientsError) throw clientsError

      // Obtener todos los tiros libres
      const { data: freeKicks, error: freeKicksError } = await supabase
        .from("free_kick_goals")
        .select(`
          id, 
          points,
          created_at,
          team_id,
          teams:team_id(id, name)
        `)
        .order("created_at")

      if (freeKicksError) throw freeKicksError

      // Filtrar solo los equipos con actividad
      const activeTeamIds = new Set([
        ...sales.map((sale) => sale.profiles?.team_id).filter(Boolean),
        ...clients.map((client) => client.profiles?.team_id).filter(Boolean),
        ...freeKicks.map((kick) => kick.team_id).filter(Boolean),
      ])

      const activeTeams = teams.filter((team) => activeTeamIds.has(team.id))

      // Obtener las últimas 4 semanas
      const today = new Date()
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(today.getDate() - 28)

      // Crear array de semanas
      const weeks = []
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(fourWeeksAgo)
        weekStart.setDate(fourWeeksAgo.getDate() + i * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weeks.push({
          start: weekStart,
          end: weekEnd,
          label: `Semana ${getWeekNumber(weekStart)}`,
        })
      }

      // Calcular goles por equipo por semana
      const teamGoalsByWeek = {}

      // Procesar cada equipo activo
      activeTeams.forEach((team) => {
        if (!team.id) return

        teamGoalsByWeek[team.id] = {
          name: team.name,
          weeklyGoals: weeks.map(() => 0), // Inicializar con 0 goles para cada semana
        }
      })

      // Calcular puntos de ventas por semana
      sales.forEach((sale) => {
        if (!sale.profiles?.team_id || !sale.created_at || !sale.points) return

        const saleDate = new Date(sale.created_at)
        const weekIndex = weeks.findIndex((week) => saleDate >= week.start && saleDate <= week.end)

        if (weekIndex === -1) return // No está en las últimas 4 semanas

        const teamId = sale.profiles.team_id
        if (!teamGoalsByWeek[teamId]) return

        // Acumular puntos (100 puntos = 1 gol)
        teamGoalsByWeek[teamId].weeklyGoals[weekIndex] += sale.points / 100
      })

      // Calcular puntos de clientes por semana (200 puntos = 2 goles por cliente)
      clients.forEach((client) => {
        if (!client.profiles?.team_id || !client.created_at) return

        const clientDate = new Date(client.created_at)
        const weekIndex = weeks.findIndex((week) => clientDate >= week.start && clientDate <= week.end)

        if (weekIndex === -1) return // No está en las últimas 4 semanas

        const teamId = client.profiles.team_id
        if (!teamGoalsByWeek[teamId]) return

        // 200 puntos = 2 goles por cliente
        teamGoalsByWeek[teamId].weeklyGoals[weekIndex] += 2
      })

      // Calcular puntos de tiros libres por semana
      freeKicks.forEach((kick) => {
        if (!kick.team_id || !kick.created_at || !kick.points) return

        const kickDate = new Date(kick.created_at)
        const weekIndex = weeks.findIndex((week) => kickDate >= week.start && kickDate <= week.end)

        if (weekIndex === -1) return // No está en las últimas 4 semanas

        const teamId = kick.team_id
        if (!teamGoalsByWeek[teamId]) return

        // Acumular puntos (100 puntos = 1 gol)
        teamGoalsByWeek[teamId].weeklyGoals[weekIndex] += kick.points / 100
      })

      // Convertir a formato para Chart.js
      const datasets = Object.values(teamGoalsByWeek)
        .filter((team: any) => team.weeklyGoals.some((goals) => goals > 0)) // Solo equipos con goles
        .map((team: any, index) => ({
          label: team.name,
          data: team.weeklyGoals.map((goals) => Math.floor(goals)), // Redondear a goles enteros
          backgroundColor: getColorByIndex(index),
          borderColor: getColorByIndex(index),
          borderWidth: 1,
        }))

      setChartData({
        labels: weeks.map((week) => week.label),
        datasets,
      })
    } catch (error) {
      console.error("Error al cargar datos del gráfico:", error)
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener el número de semana
  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Función para obtener color por índice
  function getColorByIndex(index: number) {
    const colors = [
      "rgba(255, 99, 132, 0.8)",
      "rgba(54, 162, 235, 0.8)",
      "rgba(255, 206, 86, 0.8)",
      "rgba(75, 192, 192, 0.8)",
      "rgba(153, 102, 255, 0.8)",
      "rgba(255, 159, 64, 0.8)",
      "rgba(199, 199, 199, 0.8)",
      "rgba(83, 102, 255, 0.8)",
      "rgba(40, 159, 64, 0.8)",
      "rgba(210, 199, 199, 0.8)",
    ]
    return colors[index % colors.length]
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => tooltipItems[0].label,
          label: (context) => {
            const label = context.dataset.label || ""
            const value = context.parsed.y
            return `${label}: ${value} ${value === 1 ? "gol" : "goles"}`
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

  if (chartData.datasets.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico.</p>
        <p className="text-sm text-muted-foreground">Registra ventas y clientes para ver la evolución del concurso.</p>
      </div>
    )
  }

  return <Bar options={options} data={chartData} />
}
