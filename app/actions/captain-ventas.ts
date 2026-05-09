"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { adminSupabase } from "@/lib/supabase/server"

export type CapitanVentaItem = {
  id: string
  quantity: number
  points: number
  sale_date: string | null
  created_at: string
  representative_id: string
  product_id: string
  products: { id: string; name: string; points: number; image_url?: string | null }
  user_profile: {
    id: string
    full_name: string
    team_id: string
    team?: { name: string }
  }
}

/** Filas reales de BD (types/supabase puede estar desactualizado) */
type SalesRow = {
  id: string
  quantity: number
  points: number
  sale_date: string | null
  created_at: string
  representative_id: string
  product_id: string
}

type ProfileJoinRow = {
  id: string
  full_name: string | null
  team_id: string | null
  teams?: { name: string } | null
}

function mapProfileRow(p: ProfileJoinRow) {
  return {
    id: p.id,
    full_name: p.full_name || "Usuario",
    team_id: p.team_id || "",
    team: p.teams?.name ? { name: p.teams.name } : undefined,
  }
}

/**
 * Lista ventas para /capitan/ventas usando el servidor (misma origen que el sitio).
 * Evita "Failed to fetch" cuando el navegador bloquea o falla la conexión directa a Supabase.
 */
export async function getCapitanVentasForSession(): Promise<
  { success: true; data: CapitanVentaItem[] } | { success: false; error: string }
> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "No hay sesión activa" }
    }

    const userId = session.user.id
    const role = session.user.role
    let teamId = session.user.team_id ?? null

    if (!teamId && role === "capitan") {
      const { data: row, error: pErr } = await adminSupabase
        .from("profiles")
        .select("team_id")
        .eq("id", userId)
        .maybeSingle()
      if (pErr) {
        return { success: false, error: pErr.message }
      }
      teamId = (row as { team_id: string | null } | null)?.team_id ?? null
    }

    let representativeIds: string[] = []

    if (role === "capitan" && teamId) {
      const { data: members, error: memErr } = await adminSupabase.from("profiles").select("id").eq("team_id", teamId)
      if (memErr) {
        return { success: false, error: memErr.message }
      }
      representativeIds = (members ?? []).map((m) => (m as { id: string }).id).filter(Boolean)
      if (representativeIds.length === 0) {
        return { success: true, data: [] }
      }
    } else {
      representativeIds = [userId]
    }

    const { data: salesData, error: salesError } = await adminSupabase
      .from("sales")
      .select("id, quantity, points, sale_date, created_at, representative_id, product_id")
      .in("representative_id", representativeIds)
      .order("created_at", { ascending: false })

    if (salesError) {
      return { success: false, error: salesError.message }
    }

    const salesRows = (salesData ?? []) as SalesRow[]

    if (!salesRows.length) {
      return { success: true, data: [] }
    }

    const productIds = [...new Set(salesRows.map((s) => s.product_id))]
    const repIds = [...new Set(salesRows.map((s) => s.representative_id))]

    const [productsRes, profilesRes] = await Promise.all([
      adminSupabase.from("products").select("id, name, points, image_url").in("id", productIds),
      adminSupabase
        .from("profiles")
        .select("id, full_name, team_id, teams:team_id(name)")
        .in("id", repIds),
    ])

    if (productsRes.error) {
      return { success: false, error: productsRes.error.message }
    }
    if (profilesRes.error) {
      return { success: false, error: profilesRes.error.message }
    }

    const productsData = (productsRes.data ?? []) as {
      id: string
      name: string
      points: number
      image_url?: string | null
    }[]
    const profilesData = (profilesRes.data ?? []) as ProfileJoinRow[]

    const data: CapitanVentaItem[] = salesRows.map((sale) => {
      const product = productsData.find((p) => p.id === sale.product_id)
      const prof = profilesData.find((u) => u.id === sale.representative_id)
      return {
        id: sale.id,
        quantity: sale.quantity,
        points: sale.points,
        sale_date: sale.sale_date ?? null,
        created_at: sale.created_at,
        representative_id: sale.representative_id,
        product_id: sale.product_id,
        products: product || {
          id: sale.product_id,
          name: "Producto desconocido",
          points: 0,
          image_url: null,
        },
        user_profile: prof
          ? mapProfileRow(prof as ProfileJoinRow)
          : {
              id: sale.representative_id,
              full_name: "Usuario desconocido",
              team_id: "",
            },
      }
    })

    return { success: true, data }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error al cargar ventas"
    return { success: false, error: message }
  }
}

export async function getProductosParaFiltroVentas(): Promise<
  { success: true; data: { id: string; name: string }[] } | { success: false; error: string; data: [] }
> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "No hay sesión", data: [] }
    }

    const { data, error } = await adminSupabase
      .from("products")
      .select("id, name")
      .eq("active", true)
      .order("name")

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data ?? [] }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Error", data: [] }
  }
}
