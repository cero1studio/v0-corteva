import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const teamId = searchParams.get("teamId")

  // Validar que teamId sea un valor válido
  if (!teamId || teamId === "null" || teamId === "undefined") {
    return NextResponse.json(
      {
        success: false,
        error: "ID de equipo no válido",
        data: {
          position: null,
          team: null,
          zoneRanking: [],
        },
      },
      { status: 400 },
    )
  }

  try {
    const supabase = createServerSupabaseClient()

    // Obtener datos del equipo
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("*, zones(id, name), distributors(id, name, logo_url)")
      .eq("id", teamId)
      .single()

    if (teamError) {
      console.error("Error al obtener datos del equipo:", teamError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al obtener datos del equipo: ${teamError.message}`,
          data: {
            position: null,
            team: null,
            zoneRanking: [],
          },
        },
        { status: 500 },
      )
    }

    // Obtener posición del equipo en el ranking
    const { data: positionData, error: positionError } = await supabase.rpc("get_team_position", {
      team_id_param: teamId,
    })

    if (positionError) {
      console.error("Error al obtener posición del equipo:", positionError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al obtener posición del equipo: ${positionError.message}`,
          data: {
            position: null,
            team: teamData,
            zoneRanking: [],
          },
        },
        { status: 500 },
      )
    }

    const position = positionData && positionData.length > 0 ? positionData[0].position : null
    const teamPoints = positionData && positionData.length > 0 ? positionData[0].total_points : 0

    // Obtener ranking de la zona
    let zoneRanking = []
    if (teamData.zone_id) {
      const { data: zoneRankingData, error: zoneRankingError } = await supabase.rpc("get_zone_ranking", {
        zone_id_param: teamData.zone_id,
        limit_count: 10,
      })

      if (zoneRankingError) {
        console.error("Error al obtener equipos de la zona:", zoneRankingError)
        return NextResponse.json(
          {
            success: false,
            error: `Error al obtener equipos de la zona: ${zoneRankingError.message}`,
            data: {
              position,
              team: {
                id: teamData.id,
                name: teamData.name,
                total_points: teamPoints,
                zone_id: teamData.zone_id,
                zone_name: teamData.zones?.name,
                distributor_id: teamData.distributor_id,
                distributor_name: teamData.distributors?.name,
                distributor_logo: teamData.distributors?.logo_url,
              },
              zoneRanking: [],
            },
          },
          { status: 500 },
        )
      }

      zoneRanking = zoneRankingData || []
    }

    return NextResponse.json({
      success: true,
      data: {
        position,
        team: {
          id: teamData.id,
          name: teamData.name,
          total_points: teamPoints,
          zone_id: teamData.zone_id,
          zone_name: teamData.zones?.name,
          distributor_id: teamData.distributor_id,
          distributor_name: teamData.distributors?.name,
          distributor_logo: teamData.distributors?.logo_url,
        },
        zoneRanking,
      },
    })
  } catch (error: any) {
    console.error("Error en la API de ranking:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Error en la API de ranking: ${error.message}`,
        data: {
          position: null,
          team: null,
          zoneRanking: [],
        },
      },
      { status: 500 },
    )
  }
}
