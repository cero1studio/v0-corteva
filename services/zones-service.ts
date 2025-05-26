import { createServerSupabaseClient } from "@/lib/supabase"

export async function getZones() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("zones").select("*").order("name")

  if (error) {
    console.error("Error fetching zones:", error)
    throw error
  }

  return data
}

export async function getZoneById(id: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("zones").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching zone ${id}:`, error)
    throw error
  }

  return data
}

export async function createZone(name: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("zones").insert([{ name }]).select()

  if (error) {
    console.error("Error creating zone:", error)
    throw error
  }

  return data[0]
}

export async function updateZone(id: string, name: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("zones").update({ name, updated_at: new Date() }).eq("id", id).select()

  if (error) {
    console.error(`Error updating zone ${id}:`, error)
    throw error
  }

  return data[0]
}

export async function deleteZone(id: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("zones").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting zone ${id}:`, error)
    throw error
  }

  return true
}
