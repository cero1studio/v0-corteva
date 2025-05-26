"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function registerSale(formData: FormData) {
  const supabase = createServerClient()

  // Obtener datos del formulario
  const userId = formData.get("userId") as string
  const productId = formData.get("productId") as string
  const quantity = Number.parseInt(formData.get("quantity") as string)
  const saleDate = formData.get("saleDate") as string

  try {
    // Obtener información del producto
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("points")
      .eq("id", productId)
      .single()

    if (productError) throw new Error(`Error al obtener producto: ${productError.message}`)
    if (!product) throw new Error("Producto no encontrado")

    // Calcular totales
    const totalPoints = product.points * quantity

    // Obtener la configuración de puntos para un gol
    const { data: puntosConfig, error: puntosError } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "puntos_para_gol")
      .maybeSingle()

    // Por defecto 100 puntos = 1 gol si no hay configuración
    const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

    // Registrar la venta
    const { data, error } = await supabase
      .from("sales")
      .insert({
        user_id: userId,
        product_id: productId,
        quantity,
        points: totalPoints,
        total_points: totalPoints, // Asegurar que total_points también se guarde
        sale_date: saleDate || new Date().toISOString().split("T")[0],
      })
      .select()

    if (error) throw new Error(`Error al registrar venta: ${error.message}`)

    // Obtener información del usuario y equipo
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", userId)
      .single()

    if (profileError) throw new Error(`Error al obtener perfil: ${profileError.message}`)
    if (!profile || !profile.team_id) throw new Error("Usuario sin equipo asignado")

    // Calcular puntos totales del usuario
    const { data: userSales, error: userSalesError } = await supabase
      .from("sales")
      .select("points")
      .eq("user_id", userId)

    if (userSalesError) throw new Error(`Error al obtener ventas del usuario: ${userSalesError.message}`)

    // Calcular total de puntos y goles para el usuario
    const totalUserPoints = userSales ? userSales.reduce((sum, sale) => sum + (sale.points || 0), 0) : 0
    const userGoles = Math.floor(totalUserPoints / puntosParaGol)

    console.log("Puntos totales del usuario:", totalUserPoints, "Goles:", userGoles)

    // Actualizar los puntos totales del usuario
    const { error: updateUserError } = await supabase
      .from("profiles")
      .update({
        total_points: totalUserPoints,
      })
      .eq("id", userId)

    if (updateUserError) throw new Error(`Error al actualizar puntos del usuario: ${updateUserError.message}`)

    // Calcular puntos totales del equipo (sumando todos los usuarios)
    const { data: teamUsers, error: teamUsersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("team_id", profile.team_id)

    if (teamUsersError) throw new Error(`Error al obtener usuarios del equipo: ${teamUsersError.message}`)

    let totalTeamPoints = 0

    // Sumar puntos de todos los usuarios del equipo
    for (const user of teamUsers || []) {
      const { data: userSales, error: salesError } = await supabase
        .from("sales")
        .select("points")
        .eq("user_id", user.id)

      if (salesError) continue

      const userPoints = userSales ? userSales.reduce((sum, sale) => sum + (sale.points || 0), 0) : 0
      totalTeamPoints += userPoints
    }

    const teamGoles = Math.floor(totalTeamPoints / puntosParaGol)

    console.log("Puntos totales del equipo:", totalTeamPoints, "Goles del equipo:", teamGoles)

    // Actualizar los puntos totales y goles del equipo
    const { error: updateTeamError } = await supabase
      .from("teams")
      .update({
        total_points: totalTeamPoints,
        goals: teamGoles,
      })
      .eq("id", profile.team_id)

    if (updateTeamError) throw new Error(`Error al actualizar equipo: ${updateTeamError.message}`)

    // Verificar si se cumple el objetivo semanal para otorgar penalti
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Lunes de la semana actual

    const { data: weekSales, error: weekSalesError } = await supabase
      .from("sales")
      .select("points")
      .eq("user_id", userId)
      .gte("sale_date", startOfWeek.toISOString().split("T")[0])

    if (weekSalesError) throw new Error(`Error al obtener ventas semanales: ${weekSalesError.message}`)

    // Obtener configuración del sistema
    const { data: penaltyConfig, error: configError } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "penalty_settings")
      .single()

    if (configError) throw new Error(`Error al obtener configuración: ${configError.message}`)

    const config = penaltyConfig.value
    const salesTarget = config.sales_target || 5
    const penaltyReward = config.penalty_reward || 1

    // Verificar si se alcanzó el objetivo de ventas semanales
    const weeklyCount = weekSales ? weekSales.length : 0

    if (weeklyCount >= salesTarget) {
      // Verificar si ya se otorgó un penalti esta semana
      const { data: existingPenalty, error: penaltyCheckError } = await supabase
        .from("penalty_history")
        .select("id")
        .eq("team_id", profile.team_id)
        .eq("action", "earned")
        .gte("created_at", startOfWeek.toISOString())
        .ilike("description", "%objetivo semanal%")

      if (penaltyCheckError) throw new Error(`Error al verificar penaltis: ${penaltyCheckError.message}`)

      // Si no se ha otorgado un penalti esta semana, otorgar uno
      if (!existingPenalty || existingPenalty.length === 0) {
        // Crear nuevo penalti
        const { data: penalty, error: penaltyError } = await supabase
          .from("penalties")
          .insert({
            team_id: profile.team_id,
            quantity: penaltyReward,
            used: 0,
            reason: "Objetivo semanal de ventas alcanzado",
          })
          .select()
          .single()

        if (penaltyError) throw new Error(`Error al crear penalti: ${penaltyError.message}`)

        // Registrar en historial
        await supabase.from("penalty_history").insert({
          penalty_id: penalty.id,
          team_id: profile.team_id,
          action: "earned",
          quantity: penaltyReward,
          description: "Objetivo semanal de ventas alcanzado",
        })
      }
    }

    revalidatePath("/capitan/dashboard")
    revalidatePath("/admin/dashboard")
    revalidatePath("/ranking")
    revalidatePath("/capitan/ranking")

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en registerSale:", error)
    return { success: false, error: error.message }
  }
}

export async function getSalesByTeam(teamId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        id,
        quantity,
        points,
        sale_date,
        created_at,
        products (id, name),
        profiles (id, full_name)
      `)
      .eq("profiles.team_id", teamId)

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getSalesByTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function getSalesByUser(userId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        id,
        quantity,
        points,
        sale_date,
        created_at,
        products (id, name)
      `)
      .eq("user_id", userId)
      .order("sale_date", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getSalesByUser:", error)
    return { success: false, error: error.message }
  }
}

export async function getTotalSalesByZone() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.rpc("get_sales_by_zone")

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getTotalSalesByZone:", error)
    return { success: false, error: error.message }
  }
}

// Nueva función para actualizar los puntos y goles de todos los equipos
export async function updateAllTeamsPoints() {
  const supabase = createServerClient()

  try {
    // Obtener todos los equipos
    const { data: teams, error: teamsError } = await supabase.from("teams").select("id")

    if (teamsError) throw new Error(`Error al obtener equipos: ${teamsError.message}`)

    // Obtener la configuración de puntos para un gol
    const { data: puntosConfig, error: puntosError } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "puntos_para_gol")
      .maybeSingle()

    // Por defecto 100 puntos = 1 gol si no hay configuración
    const puntosParaGol = puntosConfig?.value ? Number(puntosConfig.value) : 100

    // Para cada equipo, calcular sus puntos totales y goles
    for (const team of teams || []) {
      // Obtener todas las ventas de los usuarios del equipo
      const { data: teamSales, error: salesError } = await supabase
        .from("sales")
        .select("points")
        .eq("profiles.team_id", team.id)

      if (salesError) {
        console.error(`Error al obtener ventas del equipo ${team.id}: ${salesError.message}`)
        continue
      }

      // Calcular puntos totales y goles
      const totalPoints = teamSales ? teamSales.reduce((sum, sale) => sum + (sale.points || 0), 0) : 0
      const goals = Math.floor(totalPoints / puntosParaGol)

      // Actualizar el equipo
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          total_points: totalPoints,
          goals: goals,
        })
        .eq("id", team.id)

      if (updateError) {
        console.error(`Error al actualizar equipo ${team.id}: ${updateError.message}`)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error en updateAllTeamsPoints:", error)
    return { success: false, error: error.message }
  }
}

// Nueva función para obtener los puntos totales de un usuario
export async function getUserTotalPoints(userId: string) {
  const supabase = createServerClient()

  try {
    const { data: sales, error } = await supabase.from("sales").select("points").eq("user_id", userId)

    if (error) throw error

    const totalPoints = sales ? sales.reduce((sum, sale) => sum + (sale.points || 0), 0) : 0

    return { success: true, totalPoints }
  } catch (error: any) {
    console.error("Error en getUserTotalPoints:", error)
    return { success: false, error: error.message, totalPoints: 0 }
  }
}
