"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createServerSupabaseClient, adminSupabase } from "@/lib/supabase/server"
import { formatColombianMobile, getPhoneValidationError } from "@/lib/phone-validation"
import { revalidatePath } from "next/cache"
import { reconcileTeamContestTotals } from "@/app/actions/team-points-sync"

export type RegisterCapitanClientePayload = {
  farmerName: string
  businessName: string
  saleType: string
  storeName: string | null
  farmLocation: string
  farmAreaHectares: number
  previousProduct: string
  superGanaderiaProduct: string
  volumenFacturado: number
  contactInfo: string
  notes: string
}

/** Lista clientes del equipo del capitán vía servidor (NextAuth + service role). Evita cliente Supabase sin sesión en el navegador. */
export async function getCapitanClientsForSession(): Promise<
  { success: true; data: { id: string; client_name: string; created_at: string }[] } | { success: false; error: string }
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

    if (!teamId) {
      return { success: true, data: [] }
    }

    const { data, error } = await adminSupabase
      .from("competitor_clients")
      .select("id, client_name, created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data ?? [] }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error"
    return { success: false, error: msg }
  }
}

export async function registerCapitanCompetitorClient(
  payload: RegisterCapitanClientePayload,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "No hay sesión activa" }
    }

    const userId = session.user.id
    if (session.user.role !== "capitan") {
      return { success: false, error: "Solo los capitanes pueden registrar clientes" }
    }

    const {
      farmerName,
      businessName,
      saleType,
      storeName,
      farmLocation,
      farmAreaHectares,
      previousProduct,
      superGanaderiaProduct,
      volumenFacturado,
      contactInfo,
      notes,
    } = payload

    if (
      !farmerName?.trim() ||
      !businessName?.trim() ||
      !saleType ||
      !farmLocation?.trim() ||
      !previousProduct?.trim() ||
      !superGanaderiaProduct ||
      volumenFacturado < 100 ||
      !contactInfo?.trim() ||
      !notes?.trim()
    ) {
      return { success: false, error: "Datos incompletos o volumen inválido" }
    }

    if (saleType === "Venta por Almacén" && !storeName?.trim()) {
      return { success: false, error: "Indica el nombre del almacén" }
    }

    const areaFinca = Number(farmAreaHectares)
    if (Number.isNaN(areaFinca) || areaFinca <= 0) {
      return { success: false, error: "Área de finca inválida" }
    }

    const phoneErr = getPhoneValidationError(contactInfo)
    if (phoneErr) {
      return { success: false, error: phoneErr }
    }

    const formattedPhone = formatColombianMobile(contactInfo)

    const { data: profileRow, error: profileError } = await adminSupabase
      .from("profiles")
      .select("team_id")
      .eq("id", userId)
      .single()

    const profile = profileRow as { team_id: string | null } | null

    if (profileError || !profile?.team_id) {
      return { success: false, error: "Usuario sin equipo asignado" }
    }

    const teamId = profile.team_id

    const { error: insertError } = await adminSupabase
      .from("competitor_clients")
      .insert({
        client_name: farmerName.trim(),
        competitor_name: farmerName.trim(),
        ganadero_name: farmerName.trim(),
        razon_social: businessName.trim(),
        tipo_venta: saleType,
        nombre_almacen: saleType === "Venta por Almacén" ? storeName!.trim() : null,
        ubicacion_finca: farmLocation.trim(),
        area_finca_hectareas: areaFinca,
        producto_anterior: previousProduct.trim(),
        producto_super_ganaderia: superGanaderiaProduct,
        volumen_venta_estimado: volumenFacturado,
        contact_info: formattedPhone,
        notes: notes.trim(),
        representative_id: userId,
        team_id: teamId,
        points: 200,
      } as never)

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    await reconcileTeamContestTotals(teamId)

    revalidatePath("/capitan/dashboard")
    revalidatePath("/capitan/clientes")
    revalidatePath("/admin/dashboard")
    revalidatePath("/ranking")
    revalidatePath("/capitan/ranking")

    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al registrar"
    return { success: false, error: msg }
  }
}

export async function registerCompetitorClient(formData: FormData) {
  const supabase = createServerSupabaseClient()

  // Obtener datos del formulario
  const clientName = formData.get("name") as string
  const previousSupplier = formData.get("previousSupplier") as string
  const contactInfo = formData.get("contactInfo") as string
  const notes = formData.get("notes") as string
  const capturedBy = formData.get("userId") as string

  try {
    // Obtener información del usuario y equipo
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", capturedBy)
      .single()

    if (profileError) throw new Error(`Error al obtener perfil: ${profileError.message}`)
    if (!profile || !profile.team_id) throw new Error("Usuario sin equipo asignado")

    // Registrar el cliente
    const { data, error } = await supabase
      .from("competitor_clients")
      .insert({
        client_name: clientName,
        competitor_name: previousSupplier,
        ganadero_name: contactInfo,
        representative_id: capturedBy,
        team_id: profile.team_id,
        points: 0,
      })
      .select()

    if (error) throw new Error(`Error al registrar cliente: ${error.message}`)

    await reconcileTeamContestTotals(profile.team_id)

    revalidatePath("/capitan/dashboard")
    revalidatePath("/capitan/clientes")
    revalidatePath("/admin/dashboard")
    revalidatePath("/ranking")
    revalidatePath("/capitan/ranking")

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en registerCompetitorClient:", error)
    return { success: false, error: error.message }
  }
}

export async function getCompetitorClientsByTeam(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select(`
        id,
        client_name,
        created_at,
        team_id,
        representative_id,
        profiles:representative_id (
          id, 
          full_name,
          team_id,
          teams:team_id (
            id,
            name,
            zone_id,
            zones:zone_id (
              id,
              name
            ),
            distributor_id,
            distributors:distributor_id (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByTeam:", error)
    return { success: false, error: error.message }
  }
}

export async function getCompetitorClientsByUser(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("competitor_clients")
      .select(`
        id,
        client_name,
        created_at,
        representative_id,
        profiles:representative_id (
          id, 
          full_name,
          team_id,
          teams:team_id (
            id,
            name,
            zone_id,
            zones:zone_id (
              id,
              name
            ),
            distributor_id,
            distributors:distributor_id (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq("representative_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error en getCompetitorClientsByUser:", error)
    return { success: false, error: error.message }
  }
}

const CLIENTES_POR_GOL = 3

export async function getClientGoalsInfo(teamId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Obtener todos los clientes del equipo
    const { data: clients, error } = await supabase.from("competitor_clients").select("id").eq("team_id", teamId)

    if (error) throw error

    const totalClientes = clients?.length || 0
    const golesGenerados = Math.floor(totalClientes / CLIENTES_POR_GOL)
    const clientesParaSiguienteGol = CLIENTES_POR_GOL - (totalClientes % CLIENTES_POR_GOL)

    return {
      success: true,
      data: {
        totalClientes,
        golesGenerados,
        clientesParaSiguienteGol,
        clientesPorGol: CLIENTES_POR_GOL,
      },
    }
  } catch (error: any) {
    console.error("Error en getClientGoalsInfo:", error)
    return { success: false, error: error.message }
  }
}
