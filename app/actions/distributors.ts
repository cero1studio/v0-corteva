"use server"

import { createServerClient } from "@/lib/supabase/server"

export interface Distributor {
  id: string
  name: string
  created_at: string
}

export async function getAllDistributors(): Promise<Distributor[]> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.from("distributors").select("*").order("name")

    if (error) {
      console.error("Error fetching distributors:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllDistributors:", error)
    return []
  }
}

export async function createDistributor(formData: FormData) {
  try {
    const supabase = createServerClient()

    const name = formData.get("name") as string

    if (!name) {
      return { success: false, error: "El nombre es requerido" }
    }

    const { data, error } = await supabase.from("distributors").insert([{ name }]).select().single()

    if (error) {
      console.error("Error creating distributor:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in createDistributor:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function updateDistributor(id: string, formData: FormData) {
  try {
    const supabase = createServerClient()

    const name = formData.get("name") as string

    if (!name) {
      return { success: false, error: "El nombre es requerido" }
    }

    const { data, error } = await supabase.from("distributors").update({ name }).eq("id", id).select().single()

    if (error) {
      console.error("Error updating distributor:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in updateDistributor:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function deleteDistributor(id: string) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("distributors").delete().eq("id", id)

    if (error) {
      console.error("Error deleting distributor:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteDistributor:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Export alias for compatibility
export const getDistributors = getAllDistributors
