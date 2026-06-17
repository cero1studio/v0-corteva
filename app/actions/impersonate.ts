"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { adminSupabase } from "@/lib/supabase/server"

export async function getImpersonationData(targetUserId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "No autorizado" }
    }

    const { data: userRow, error: uErr } = await adminSupabase.auth.admin.getUserById(targetUserId)
    if (uErr || !userRow?.user) {
      return { success: false, error: "No se encontró el usuario" }
    }

    const { data: profile, error: pErr } = await adminSupabase
      .from("profiles")
      .select("*, teams:team_id(name)")
      .eq("id", targetUserId)
      .single()

    if (pErr || !profile) {
      return { success: false, error: "No se encontró el perfil" }
    }

    return {
      success: true,
      data: {
        id: profile.id,
        email: userRow.user.email || "",
        name: profile.full_name,
        role: profile.role,
        team_id: profile.team_id,
        team_name: profile.teams?.name || null,
        zone_id: profile.zone_id,
        distributor_id: profile.distributor_id,
        force_password_change: profile.force_password_change
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
