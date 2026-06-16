"use server"

import { contestGoalsFromPoints, parsePuntosParaGol } from "@/lib/goals"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { validateCredentials } from "@/lib/auth-utils"
import { AUTH_ERROR_CODES, getErrorMessage } from "@/lib/auth-errors"
import { adminSupabase } from "@/lib/supabase/server"
import { rankingCache } from "@/lib/ranking-cache"

/** Cliente admin con tipos relajados: `Database` local no incluye todas las tablas. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = adminSupabase

/** Coherente con `getTeamRankingByZone` en ranking.ts (puntos por cliente capturado). */
const PUNTOS_POR_CLIENTE_COMPETENCIA = 200

export type ContestResetOptions = {
  sales: boolean
  competitorClients: boolean
  freeKickGoals: boolean
  penalties: boolean
  /** Vacía `reto_actual` y pone `reto_activo` en false (system_config). */
  retoPublicado: boolean
  /** Elimina todos los usuarios excepto los que tienen rol 'admin' */
  users: boolean
  /** Elimina todos los equipos */
  teams: boolean
}

const NIL_UUID = "00000000-0000-0000-0000-000000000000"

async function upsertSystemConfigKey(key: string, value: unknown) {
  const now = new Date().toISOString()
  const { data: existing } = await db.from("system_config").select("id").eq("key", key).maybeSingle()
  if (existing) {
    const { error } = await db.from("system_config").update({ value, updated_at: now }).eq("key", key)
    if (error) throw new Error(`${key}: ${error.message}`)
  } else {
    const { error } = await db.from("system_config").insert({
      key,
      value,
      description: `Configuración para ${key}`,
      created_at: now,
      updated_at: now,
    })
    if (error) throw new Error(`${key}: ${error.message}`)
  }
}

async function recalculateAllTeamTotals() {
  const { data: puntosRow } = await db.from("system_config").select("value").eq("key", "puntos_para_gol").maybeSingle()
  const puntosParaGol = parsePuntosParaGol(puntosRow?.value)

  const { data: teams, error: teamsError } = await db.from("teams").select("id")
  if (teamsError || !teams?.length) return

  for (const team of teams) {
    const teamId = team.id

    const { data: memberRows } = await db.from("profiles").select("id").eq("team_id", teamId)
    const memberIds = memberRows?.map((m: { id: string }) => m.id).filter(Boolean) ?? []

    const [repSalesRes, teamSalesRes, clientCountRes] = await Promise.all([
      memberIds.length
        ? db.from("sales").select("points").in("representative_id", memberIds)
        : Promise.resolve({ data: [] as { points: number | null }[] }),
      db.from("sales").select("points").eq("team_id", teamId),
      db.from("competitor_clients").select("id", { count: "exact", head: true }).eq("team_id", teamId),
    ])

    const repPts =
      repSalesRes.data?.reduce((s: number, r: { points?: number | null }) => s + (Number(r.points) || 0), 0) ?? 0
    const directTeamPts =
      teamSalesRes.data?.reduce((s: number, r: { points?: number | null }) => s + (Number(r.points) || 0), 0) ?? 0
    const salesPts = repPts + directTeamPts

    const clientCount = clientCountRes.count
    const nClients = clientCount ?? 0
    const clientPts = nClients * PUNTOS_POR_CLIENTE_COMPETENCIA
    const pointsForGoals = salesPts + clientPts
    const goals = contestGoalsFromPoints(pointsForGoals, puntosParaGol)
    const total_points = pointsForGoals

    await db.from("teams").update({ total_points, goals }).eq("id", teamId)
  }
}

function revalidateAfterReset() {
  const paths = [
    "/admin",
    "/admin/dashboard",
    "/admin/ranking",
    "/admin/tiros-libres",
    "/admin/ventas",
    "/admin/clientes",
    "/admin/retos",
    "/capitan/dashboard",
    "/capitan/ranking",
    "/capitan/ventas",
    "/capitan/clientes",
    "/director-tecnico/dashboard",
    "/director-tecnico/reportes",
    "/director-tecnico/ranking",
    "/ranking",
    "/ranking-publico",
  ]
  for (const p of paths) {
    revalidatePath(p)
  }
}

/**
 * Borrado masivo selectivo de datos del concurso. Solo administradores.
 * Requiere la contraseña del usuario en sesión (misma que usa para iniciar sesión).
 */
export async function executeContestReset(
  password: string,
  options: ContestResetOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || session.user.role !== "admin") {
      return { success: false, error: "No autorizado." }
    }

    const anySelected =
      options.sales ||
      options.competitorClients ||
      options.freeKickGoals ||
      options.penalties ||
      options.retoPublicado ||
      options.users ||
      options.teams
    if (!anySelected) {
      return { success: false, error: "Selecciona al menos un tipo de dato a borrar." }
    }

    if (!password?.trim()) {
      return { success: false, error: "Indica tu contraseña para confirmar." }
    }

    try {
      await validateCredentials(session.user.email, password)
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : AUTH_ERROR_CODES.AUTH_ERROR
      return { success: false, error: getErrorMessage(code) }
    }

    // Primero recolectamos usuarios si se van a borrar, pero los borramos al final
    let usersToDelete: any[] = []
    if (options.users) {
      const { data, error: fetchErr } = await db.from("profiles").select("id").neq("role", "admin")
      if (fetchErr) {
        return { success: false, error: `No se pudieron obtener los usuarios: ${fetchErr.message}` }
      }
      usersToDelete = data || []
    }

    if (options.teams) {
      // 1. Desvincular todos los usuarios de sus equipos
      await db.from("profiles").update({ team_id: null }).neq("id", NIL_UUID)
      // 2. Borrar todos los equipos
      const { error: teamsErr } = await db.from("teams").delete().neq("id", NIL_UUID)
      if (teamsErr) {
        console.error("contest-reset teams:", teamsErr)
        return { success: false, error: `No se pudieron borrar los equipos: ${teamsErr.message}` }
      }
    }

    if (options.penalties) {
      const { error: hErr } = await db.from("penalty_history").delete().neq("id", NIL_UUID)
      if (hErr) {
        console.error("contest-reset penalty_history:", hErr)
        return { success: false, error: `No se pudo borrar historial de penaltis: ${hErr.message}` }
      }
      const { error: pErr } = await db.from("penalties").delete().neq("id", NIL_UUID)
      if (pErr) {
        console.error("contest-reset penalties:", pErr)
        return { success: false, error: `No se pudo borrar penaltis: ${pErr.message}` }
      }
    }

    if (options.sales) {
      const { error } = await db.from("sales").delete().neq("id", NIL_UUID)
      if (error) {
        console.error("contest-reset sales:", error)
        return { success: false, error: `No se pudo borrar ventas: ${error.message}` }
      }
    }

    if (options.freeKickGoals) {
      const { error } = await db.from("free_kick_goals").delete().neq("id", NIL_UUID)
      if (error) {
        console.error("contest-reset free_kick_goals:", error)
        return { success: false, error: `No se pudo borrar tiros libres: ${error.message}` }
      }
    }

    if (options.competitorClients) {
      const { error } = await db.from("competitor_clients").delete().neq("id", NIL_UUID)
      if (error) {
        console.error("contest-reset competitor_clients:", error)
        return { success: false, error: `No se pudo borrar clientes: ${error.message}` }
      }
    }

    if (options.retoPublicado) {
      try {
        await upsertSystemConfigKey("reto_actual", "")
        await upsertSystemConfigKey("reto_activo", "false")
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error al resetear reto"
        console.error("contest-reset reto config:", e)
        return { success: false, error: msg }
      }
    }

    // AHORA borramos perfiles de usuario, porque ya se limpiaron las dependencias (si las marcaron)
    if (options.users && usersToDelete.length > 0) {
      // 1. Limpiar llaves foraneas si es que no borraron ventas o equipos
      await db.from("teams").update({ captain_id: null }).neq("id", NIL_UUID)
      
      const { error: profileErr } = await db.from("profiles").delete().neq("role", "admin")
      if (profileErr) {
        console.error("Error borrando perfiles masivamente:", profileErr)
        return { success: false, error: `No se pudieron borrar los perfiles (posible restricción de llave foránea que no se seleccionó para borrado): ${profileErr.message}` }
      }

      // Borrar auth users en lotes muy rápidos (20) sin esperar tanto si falla
      const chunkSize = 20
      for (let i = 0; i < usersToDelete.length; i += chunkSize) {
        const chunk = usersToDelete.slice(i, i + chunkSize)
        await Promise.allSettled(chunk.map(u => db.auth.admin.deleteUser(u.id)))
      }
    }

    if (options.sales || options.competitorClients || options.freeKickGoals) {
      await recalculateAllTeamTotals()
      rankingCache.clear()
    }

    revalidateAfterReset()

    return { success: true }
  } catch (err: unknown) {
    console.error("executeContestReset:", err)
    return { success: false, error: err instanceof Error ? err.message : "Error inesperado." }
  }
}
