"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getSystemConfig } from "./system-config"

// Verificar y otorgar penaltis por completar desafíos
export async function checkAndAwardChallenges(userId: string, teamId: string) {
  const supabase = createServerClient()

  try {
    // Obtener configuración de desafíos
    const { success, data: config } = await getSystemConfig("desafios_config")
    if (!success || !config) {
      return { success: false, error: "No se pudo obtener la configuración de desafíos" }
    }

    const currentWeek = getWeekNumber(new Date())
    const currentYear = new Date().getFullYear()

    // Verificar desafío de ventas semanales
    await checkSalesChallenge(userId, teamId, config, currentWeek, currentYear)

    // Verificar meta de goles semanales
    await checkGoalsChallenge(teamId, config, currentWeek, currentYear)

    return { success: true }
  } catch (error: any) {
    console.error("Error en checkAndAwardChallenges:", error)
    return { success: false, error: error.message }
  }
}

// Verificar desafío de ventas semanales
async function checkSalesChallenge(userId: string, teamId: string, config: any, week: number, year: number) {
  const supabase = createServerClient()

  try {
    // Contar ventas de esta semana
    const startOfWeek = getStartOfWeek(new Date())
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", startOfWeek.toISOString())

    if (salesError) throw salesError

    const salesCount = sales?.length || 0
    const target = config.meta_ventas_semanales || 5
    const reward = config.penaltis_meta_ventas || 1

    // Si alcanzó la meta, verificar si ya se otorgó el premio esta semana
    if (salesCount >= target) {
      const { data: existingReward, error: rewardError } = await supabase
        .from("penalties")
        .select("id")
        .eq("team_id", teamId)
        .eq("reason", `Desafío de ventas semanales completado - Semana ${week}/${year}`)

      if (rewardError) throw rewardError

      // Si no existe el premio, otorgarlo
      if (!existingReward || existingReward.length === 0) {
        await supabase.from("penalties").insert({
          team_id: teamId,
          quantity: reward,
          used: 0,
          reason: `Desafío de ventas semanales completado - Semana ${week}/${year}`,
        })

        console.log(`Otorgado ${reward} penalti(s) por completar desafío de ventas`)
      }
    }
  } catch (error) {
    console.error("Error en checkSalesChallenge:", error)
  }
}

// Verificar meta de goles semanales
async function checkGoalsChallenge(teamId: string, config: any, week: number, year: number) {
  const supabase = createServerClient()

  try {
    // Obtener puntos para gol
    const { success: puntosSuccess, data: puntosData } = await getSystemConfig("puntos_para_gol")
    const puntosParaGol = puntosSuccess && puntosData ? Number(puntosData) : 100

    // Contar goles de esta semana para el equipo
    const startOfWeek = getStartOfWeek(new Date())
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("total_points, profiles!inner(team_id)")
      .eq("profiles.team_id", teamId)
      .gte("created_at", startOfWeek.toISOString())

    if (salesError) throw salesError

    const totalPoints = sales?.reduce((sum, sale) => sum + (sale.total_points || 0), 0) || 0
    const totalGoals = Math.floor(totalPoints / puntosParaGol)
    const target = config.meta_goles_semanales || 40
    const reward = config.penaltis_meta_goles || 1

    // Si alcanzó la meta, verificar si ya se otorgó el premio esta semana
    if (totalGoals >= target) {
      const { data: existingReward, error: rewardError } = await supabase
        .from("penalties")
        .select("id")
        .eq("team_id", teamId)
        .eq("reason", `Meta de goles semanales completada - Semana ${week}/${year}`)

      if (rewardError) throw rewardError

      // Si no existe el premio, otorgarlo
      if (!existingReward || existingReward.length === 0) {
        await supabase.from("penalties").insert({
          team_id: teamId,
          quantity: reward,
          used: 0,
          reason: `Meta de goles semanales completada - Semana ${week}/${year}`,
        })

        console.log(`Otorgado ${reward} penalti(s) por completar meta de goles`)
      }
    }
  } catch (error) {
    console.error("Error en checkGoalsChallenge:", error)
  }
}

// Obtener progreso de desafíos para un usuario/equipo
export async function getChallengeProgress(userId: string, teamId: string) {
  const supabase = createServerClient()

  try {
    // Obtener configuración de desafíos
    const { success, data: config } = await getSystemConfig("desafios_config")
    if (!success || !config) {
      return { success: false, error: "No se pudo obtener la configuración de desafíos" }
    }

    // Obtener puntos para gol
    const { success: puntosSuccess, data: puntosData } = await getSystemConfig("puntos_para_gol")
    const puntosParaGol = puntosSuccess && puntosData ? Number(puntosData) : 100

    const startOfWeek = getStartOfWeek(new Date())

    // Progreso de ventas semanales
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", startOfWeek.toISOString())

    if (salesError) throw salesError

    const salesCount = sales?.length || 0
    const salesTarget = config.meta_ventas_semanales || 5
    const salesProgress = Math.min((salesCount / salesTarget) * 100, 100)

    // Progreso de goles semanales del equipo
    const { data: teamSales, error: teamSalesError } = await supabase
      .from("sales")
      .select("total_points, profiles!inner(team_id)")
      .eq("profiles.team_id", teamId)
      .gte("created_at", startOfWeek.toISOString())

    if (teamSalesError) throw teamSalesError

    const totalPoints = teamSales?.reduce((sum, sale) => sum + (sale.total_points || 0), 0) || 0
    const totalGoals = Math.floor(totalPoints / puntosParaGol)
    const goalsTarget = config.meta_goles_semanales || 40
    const goalsProgress = Math.min((totalGoals / goalsTarget) * 100, 100)

    return {
      success: true,
      data: {
        sales: {
          current: salesCount,
          target: salesTarget,
          progress: salesProgress,
          completed: salesCount >= salesTarget,
          reward: config.penaltis_meta_ventas || 1,
        },
        goals: {
          current: totalGoals,
          target: goalsTarget,
          progress: goalsProgress,
          completed: totalGoals >= goalsTarget,
          reward: config.penaltis_meta_goles || 1,
        },
      },
    }
  } catch (error: any) {
    console.error("Error en getChallengeProgress:", error)
    return { success: false, error: error.message }
  }
}

// Funciones auxiliares
function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
  return new Date(d.setDate(diff))
}
