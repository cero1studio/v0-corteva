import { getFreeKicksRankingByZone, getTeamRankingByZone } from "@/app/actions/ranking"
import { getSystemConfig } from "@/app/actions/system-config"
import { parsePuntosParaGol } from "@/lib/goals"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Goles (ventas + clientes) y tiros libres (clasificación aparte).
 * `data` mantiene el array principal por compatibilidad; `freeKicks` es la clasificación aparte.
 */
export async function GET(req: NextRequest) {
  const zoneId = req.nextUrl.searchParams.get("zoneId") || undefined

  try {
    const [official, freeKicks, puntosRes] = await Promise.all([
      getTeamRankingByZone(zoneId),
      getFreeKicksRankingByZone(zoneId),
      getSystemConfig("puntos_para_gol"),
    ])

    const puntosParaGol = parsePuntosParaGol(puntosRes.success ? puntosRes.data : undefined)

    if (!official.success) {
      return NextResponse.json(
        {
          success: false,
          error: official.error ?? "Error al cargar ranking",
          data: [],
          freeKicks: [],
          puntosParaGol,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: official.data ?? [],
      freeKicks: freeKicks.success ? freeKicks.data ?? [] : [],
      puntosParaGol,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    console.error("Error en /api/ranking-list:", error)
    return NextResponse.json(
      { success: false, error: message, data: [], freeKicks: [], puntosParaGol: parsePuntosParaGol(undefined) },
      { status: 500 },
    )
  }
}
