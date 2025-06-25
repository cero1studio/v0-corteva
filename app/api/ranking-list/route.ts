import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Devuelve el ranking general o por zona usando las funciones que SÍ existen
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const zoneId = req.nextUrl.searchParams.get("zoneId") || null

  try {
    if (zoneId) {
      // Ranking por zona usando get_zone_ranking_with_limit
      const { data, error } = await supabase.rpc("get_zone_ranking_with_limit", {
        zone_id_param: zoneId,
        limit_count: 100,
      })
      if (error) throw error
      return NextResponse.json({ success: true, data: data || [] })
    }

    // Ranking general usando get_team_ranking_with_limit
    const { data, error } = await supabase.rpc("get_team_ranking_with_limit", {
      limit_count: 100,
    })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error("Error en /api/ranking-list:", error)
    return NextResponse.json({ success: false, error: error.message ?? "Unexpected error", data: [] }, { status: 500 })
  }
}
