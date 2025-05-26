import { NextResponse } from "next/server"
import { updateAllTeamsPoints } from "@/app/actions/sales"

export async function GET() {
  try {
    const result = await updateAllTeamsPoints()

    if (result.success) {
      return NextResponse.json({ message: "Puntos y goles actualizados correctamente" })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
