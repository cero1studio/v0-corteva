"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function registerSale(formData: FormData) {
  const supabase = createServerSupabaseClient()

  const product_id = formData.get("product_id") as string
  const quantity = formData.get("quantity") as string
  const points = formData.get("points") as string
  const price = formData.get("price") as string
  const userId = formData.get("user_id") as string
  const team_id = formData.get("team_id") as string

  try {
    // Validar datos requeridos
    if (!product_id || !quantity || !userId || !team_id) {
      throw new Error("Faltan datos requeridos")
    }

    // Calcular puntos finales
    let finalPoints = 0

    if (points && points !== "0" && points !== "") {
      finalPoints = Number.parseFloat(points)
    } else if (price && price !== "0" && price !== "") {
      finalPoints = Number.parseFloat(price) * Number.parseInt(quantity)
    } else {
      // Obtener precio del producto
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("price")
        .eq("id", product_id)
        .single()

      if (productError || !product) {
        throw new Error("No se pudo obtener información del producto")
      }

      finalPoints = (product.price || 0) * Number.parseInt(quantity)
    }

    if (!finalPoints || finalPoints <= 0) {
      throw new Error("Los puntos calculados no son válidos")
    }

    const { data, error } = await supabase
      .from("sales")
      .insert([
        {
          product_id: product_id,
          quantity: Number.parseInt(quantity),
          points: finalPoints,
          representative_id: userId,
          team_id: team_id,
          sale_date: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Error registering sale:", error)
      throw error
    }

    revalidatePath("/sales")
    revalidatePath("/capitan/ventas")
    revalidatePath("/capitan/dashboard")
    revalidatePath("/admin/ventas")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error in registerSale:", error)
    return { success: false, error: error.message }
  }
}

export async function getSales() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: sales, error } = await supabase.from("sales").select(`
        id,
        quantity,
        points,
        sale_date,
        created_at,
        products (
          name
        ),
        profiles (
          full_name
        )
    `)

    if (error) {
      console.error("Error fetching sales:", error)
      return []
    }

    return sales || []
  } catch (error) {
    console.error("Unexpected error fetching sales:", error)
    return []
  }
}

export async function getSalesByUser(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data: sales, error } = await supabase
      .from("sales")
      .select(`
            id,
            quantity,
            points,
            sale_date,
            created_at,
            products (
              name,
              image_url
            ),
            profiles (
              full_name,
              team_id,
              teams (
                name,
                zone_id,
                zones (
                  name
                )
              )
            )
        `)
      .eq("representative_id", userId)

    if (error) {
      console.error("Error fetching sales by user:", error)
      return []
    }

    return sales || []
  } catch (error) {
    console.error("Unexpected error fetching sales by user:", error)
    return []
  }
}

// Simplificar la función getAllSales para evitar problemas de relaciones múltiples
export async function getAllSales() {
  const supabase = createServerSupabaseClient()

  try {
    // Primero obtenemos las ventas básicas
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select(`
        id,
        team_id,
        product_id,
        representative_id,
        quantity,
        points,
        kilos,
        sale_date,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (salesError) {
      console.error("Error fetching sales:", salesError)
      return { success: false, error: salesError.message }
    }

    if (!salesData || salesData.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener productos
    const productIds = [...new Set(salesData.map((sale) => sale.product_id))]
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, image_url")
      .in("id", productIds)

    if (productsError) {
      console.error("Error fetching products:", productsError)
    }

    // Obtener perfiles (representantes)
    const representativeIds = [...new Set(salesData.map((sale) => sale.representative_id))]
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, team_id, distributor_id")
      .in("id", representativeIds)

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
    }

    // Obtener distribuidores
    const distributorIds = [...new Set((profiles || []).map((profile) => profile.distributor_id).filter(Boolean))]
    const { data: distributors, error: distributorsError } = await supabase
      .from("distributors")
      .select("id, name")
      .in("id", distributorIds)

    if (distributorsError) {
      console.error("Error fetching distributors:", distributorsError)
    }

    // Obtener equipos
    const teamIds = [
      ...new Set([
        ...(profiles || []).map((profile) => profile.team_id).filter(Boolean),
        ...salesData.map((sale) => sale.team_id).filter(Boolean),
      ]),
    ]
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, zone_id")
      .in("id", teamIds)

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
    }

    // Obtener zonas
    const zoneIds = [...new Set((teams || []).map((team) => team.zone_id).filter(Boolean))]
    const { data: zones, error: zonesError } = await supabase.from("zones").select("id, name").in("id", zoneIds)

    if (zonesError) {
      console.error("Error fetching zones:", zonesError)
    }

    // Combinar todos los datos
    const enrichedSales = salesData.map((sale) => {
      const product = (products || []).find((p) => p.id === sale.product_id)
      const profile = (profiles || []).find((p) => p.id === sale.representative_id)

      // Primero intentamos obtener el team_id de la venta, si no existe usamos el del perfil
      const teamId = sale.team_id || (profile ? profile.team_id : null)
      const team = teamId ? (teams || []).find((t) => t.id === teamId) : null
      const zone = team ? (zones || []).find((z) => z.id === team.zone_id) : null
      const distributor = profile?.distributor_id
        ? (distributors || []).find((d) => d.id === profile.distributor_id)
        : null

      return {
        id: sale.id,
        team_id: teamId,
        quantity: sale.quantity,
        points: sale.points,
        price: sale.points, // Mapear points a price para compatibilidad con UI
        kilos: sale.kilos, // Incluir kilos
        sale_date: sale.sale_date,
        created_at: sale.created_at,
        products: product
          ? {
              id: product.id,
              name: product.name,
              image_url: product.image_url,
            }
          : null,
        representative: profile
          ? {
              id: profile.id,
              full_name: profile.full_name,
              team_id: profile.team_id,
              distributor_id: profile.distributor_id,
            }
          : null,
        team: team
          ? {
              id: team.id,
              name: team.name,
              zone_id: team.zone_id,
            }
          : null,
        zone: zone
          ? {
              id: zone.id,
              name: zone.name,
            }
          : null,
        distributor: distributor
          ? {
              id: distributor.id,
              name: distributor.name,
            }
          : null,
      }
    })

    return { success: true, data: enrichedSales }
  } catch (error: any) {
    console.error("Unexpected error fetching all sales:", error)
    return { success: false, error: error.message }
  }
}

// En la función createSale, agregar validación y cálculo de puntos:

export async function createSale(formData: FormData) {
  const supabase = createServerSupabaseClient()

  const product_id = formData.get("product_id") as string
  const quantity = formData.get("quantity") as string
  const points = formData.get("points") as string
  const price = formData.get("price") as string
  const representative_id = formData.get("representative_id") as string
  const kilos = formData.get("kilos") as string // Nuevo campo

  try {
    // Validar que tenemos todos los datos necesarios
    if (!product_id || !quantity || !representative_id) {
      throw new Error("Faltan datos requeridos: product_id, quantity, representative_id")
    }

    // Calcular puntos finales
    let finalPoints = 0

    // Prioridad: points > price > precio del producto
    if (points && points !== "0" && points !== "") {
      finalPoints = Number.parseFloat(points)
    } else if (price && price !== "0" && price !== "") {
      finalPoints = Number.parseFloat(price) * Number.parseInt(quantity)
    } else {
      // Obtener precio del producto
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("price")
        .eq("id", product_id)
        .single()

      if (productError || !product) {
        throw new Error("No se pudo obtener información del producto")
      }

      finalPoints = (product.price || 0) * Number.parseInt(quantity)
    }

    // Validar que los puntos finales son válidos
    if (!finalPoints || finalPoints <= 0) {
      throw new Error(`Los puntos calculados no son válidos: ${finalPoints}`)
    }

    // Obtener el team_id del representante
    const { data: representative, error: repError } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", representative_id)
      .single()

    if (repError || !representative) {
      throw new Error("Error al obtener información del representante")
    }

    if (!representative.team_id) {
      throw new Error("El representante no tiene un equipo asignado")
    }

    console.log("Creando venta con datos:", {
      product_id,
      quantity: Number.parseInt(quantity),
      points: finalPoints,
      representative_id,
      team_id: representative.team_id,
      kilos: kilos ? Number.parseFloat(kilos) : null, // Nuevo campo
    })

    const { data, error } = await supabase
      .from("sales")
      .insert([
        {
          product_id,
          quantity: Number.parseInt(quantity),
          points: finalPoints,
          representative_id,
          team_id: representative.team_id,
          sale_date: new Date().toISOString(),
          kilos: kilos ? Number.parseFloat(kilos) : null, // Nuevo campo
        },
      ])
      .select()

    if (error) {
      console.error("Error en insert de venta:", error)
      throw error
    }

    revalidatePath("/admin/ventas")
    revalidatePath("/capitan/ventas")
    revalidatePath("/capitan/dashboard")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error creating sale:", error)
    return { success: false, error: error.message }
  }
}

export async function updateSale(id: string, formData: FormData) {
  const supabase = createServerSupabaseClient()

  const product_id = formData.get("product_id") as string
  const quantity = formData.get("quantity") as string
  const points = formData.get("points") || (formData.get("price") as string)
  const representative_id = formData.get("representative_id") as string
  const kilos = formData.get("kilos") as string // Nuevo campo

  try {
    // Obtener el team_id del representante
    const { data: representative, error: repError } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", representative_id)
      .single()

    if (repError) {
      throw new Error("Error al obtener información del representante")
    }

    const { data, error } = await supabase
      .from("sales")
      .update({
        product_id,
        quantity: Number.parseInt(quantity),
        points: Number.parseFloat(points),
        representative_id,
        team_id: representative.team_id,
        kilos: kilos ? Number.parseFloat(kilos) : null, // Nuevo campo
      })
      .eq("id", id)
      .select()

    if (error) throw error

    revalidatePath("/admin/ventas")
    revalidatePath("/capitan/ventas")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error updating sale:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteSale(id: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.from("sales").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin/ventas")
    revalidatePath("/capitan/ventas")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting sale:", error)
    return { success: false, error: error.message }
  }
}
