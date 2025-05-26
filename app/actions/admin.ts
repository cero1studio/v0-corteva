"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Función para crear un nuevo usuario
export async function createUser(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const role = formData.get("role") as string
  const teamId = (formData.get("teamId") as string) || null

  try {
    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    // Crear perfil en la base de datos
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      role,
      team_id: teamId || null,
    })

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Función para crear un nuevo equipo
export async function createTeam(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const name = formData.get("name") as string
  const zoneId = formData.get("zoneId") as string
  const goal = Number.parseFloat(formData.get("goal") as string) || 0

  try {
    const { error } = await supabase.from("teams").insert({
      name,
      zone_id: zoneId,
      goal,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/equipos")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Función para crear una nueva zona
export async function createZone(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null

  try {
    const { error } = await supabase.from("zones").insert({
      name,
      description,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/zonas")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Función para crear un nuevo distribuidor
export async function createDistributor(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const name = formData.get("name") as string
  const zoneId = formData.get("zoneId") as string
  const address = (formData.get("address") as string) || null
  const contactName = (formData.get("contactName") as string) || null
  const contactPhone = (formData.get("contactPhone") as string) || null

  try {
    const { error } = await supabase.from("distributors").insert({
      name,
      zone_id: zoneId,
      address,
      contact_name: contactName,
      contact_phone: contactPhone,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/distribuidores")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Función para crear un nuevo producto
export async function createProduct(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const price = Number.parseFloat(formData.get("price") as string) || 0
  const points = Number.parseInt(formData.get("points") as string) || 0

  try {
    const { error } = await supabase.from("products").insert({
      name,
      description,
      price,
      points,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/productos")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
