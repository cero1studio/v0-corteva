"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { validateCredentials } from "@/lib/auth-utils"
import { AUTH_ERROR_CODES, getErrorMessage } from "@/lib/auth-errors"
import { adminSupabase } from "@/lib/supabase/server"
import { BULK_RESETTABLE_ROLE_VALUES } from "@/lib/bulk-password-reset-constants"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = adminSupabase

export type BulkPasswordResetRow = {
  correo: string
  nombre: string
  rol: string
  equipo: string
  zona: string
  distribuidor: string
  estado: string
  contraseña: string
}

export type BulkPasswordResetPartialError = {
  email: string
  message: string
}

function generateSecurePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&"
  const bytes = randomBytes(18)
  let out = ""
  for (let i = 0; i < 16; i++) {
    out += chars[bytes[i] % chars.length]
  }
  return out
}

function mapAuthEstado(user: {
  banned_until?: string | null
  email_confirmed_at?: string | null
}): string {
  if (user.banned_until) {
    const until = new Date(user.banned_until)
    if (!Number.isNaN(until.getTime()) && until > new Date()) {
      return "Bloqueado"
    }
  }
  if (user.email_confirmed_at) return "Correo verificado"
  return "Correo pendiente"
}

function sanitizeRoleFilter(roles: string[] | undefined | null): Set<string> | null {
  if (!roles || roles.length === 0) return null
  const allowed = new Set(BULK_RESETTABLE_ROLE_VALUES.map((r) => r.toLowerCase()))
  const next = new Set<string>()
  for (const r of roles) {
    const k = String(r).toLowerCase()
    if (allowed.has(k)) next.add(k)
  }
  return next.size > 0 ? next : null
}

/**
 * Resetea contraseñas en lote. Solo admin; confirma con contraseña del admin en sesión.
 * Nunca incluye usuarios con rol admin.
 */
export async function executeBulkPasswordReset(
  adminPassword: string,
  options: {
    zoneId: string | null
    /** Vacío o null = todos los roles reseteables */
    roles: string[] | null
  },
): Promise<{
  success: boolean
  rows?: BulkPasswordResetRow[]
  partialErrors?: BulkPasswordResetPartialError[]
  error?: string
  resetCount?: number
}> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || session.user.role !== "admin") {
      return { success: false, error: "No autorizado." }
    }

    if (!adminPassword?.trim()) {
      return { success: false, error: "Indica tu contraseña para confirmar." }
    }

    try {
      await validateCredentials(session.user.email, adminPassword)
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : AUTH_ERROR_CODES.AUTH_ERROR
      return { success: false, error: getErrorMessage(code) }
    }

    const roleSet = sanitizeRoleFilter(options.roles)

    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select("id, email, full_name, role, zone_id, distributor_id, team_id")
      .order("full_name")

    if (profilesError) {
      console.error("bulk-password-reset profiles:", profilesError)
      return { success: false, error: `Error al listar usuarios: ${profilesError.message}` }
    }

    let list = (profiles || []).filter(
      (p: { role?: string | null }) => String(p.role || "").toLowerCase() !== "admin",
    )

    if (roleSet) {
      list = list.filter((p: { role?: string | null }) => roleSet.has(String(p.role || "").toLowerCase()))
    }

    if (options.zoneId && options.zoneId !== "all") {
      list = list.filter((p: { zone_id?: string | null }) => p.zone_id === options.zoneId)
    }

    if (list.length === 0) {
      return { success: false, error: "No hay usuarios que coincidan con los filtros (recuerda: nunca se incluyen administradores)." }
    }

    const [{ data: zones }, { data: distributors }, { data: teams }] = await Promise.all([
      db.from("zones").select("id, name"),
      db.from("distributors").select("id, name"),
      db.from("teams").select("id, name"),
    ])

    const zoneMap = Object.fromEntries((zones || []).map((z: { id: string; name: string }) => [z.id, z.name]))
    const distMap = Object.fromEntries(
      (distributors || []).map((d: { id: string; name: string }) => [d.id, d.name]),
    )
    const teamMap = Object.fromEntries((teams || []).map((t: { id: string; name: string }) => [t.id, t.name]))

    const rows: BulkPasswordResetRow[] = []
    const partialErrors: BulkPasswordResetPartialError[] = []

    for (const p of list) {
      const email = String(p.email || "")
      const pid = p.id as string

      const { data: authData, error: authGetErr } = await db.auth.admin.getUserById(pid)
      if (authGetErr || !authData?.user) {
        partialErrors.push({
          email: email || pid,
          message: authGetErr?.message || "Usuario no encontrado en autenticación",
        })
        continue
      }

      const estado = mapAuthEstado(authData.user)
      const newPassword = generateSecurePassword()

      const { error: updErr } = await db.auth.admin.updateUserById(pid, { password: newPassword })
      if (updErr) {
        partialErrors.push({ email, message: updErr.message })
        continue
      }

      rows.push({
        correo: email,
        nombre: String(p.full_name || ""),
        rol: String(p.role || ""),
        equipo: p.team_id && teamMap[p.team_id] ? teamMap[p.team_id] : "",
        zona: p.zone_id && zoneMap[p.zone_id] ? zoneMap[p.zone_id] : "",
        distribuidor: p.distributor_id && distMap[p.distributor_id] ? distMap[p.distributor_id] : "",
        estado,
        contraseña: newPassword,
      })
    }

    if (rows.length === 0) {
      return {
        success: false,
        error:
          partialErrors.length > 0
            ? "No se pudo actualizar ninguna contraseña. Revisa que existan en autenticación o los permisos del servicio."
            : "No se pudo completar el proceso.",
        partialErrors: partialErrors.length > 0 ? partialErrors : undefined,
      }
    }

    revalidatePath("/admin/usuarios")
    revalidatePath("/admin/configuracion")

    return {
      success: true,
      rows,
      partialErrors: partialErrors.length > 0 ? partialErrors : undefined,
      resetCount: rows.length,
    }
  } catch (err: unknown) {
    console.error("executeBulkPasswordReset:", err)
    return { success: false, error: err instanceof Error ? err.message : "Error inesperado." }
  }
}
