"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function registerSale(formData: FormData) {
  const supabase = createClient()

  const product_id = formData.get("product_id") as string
  const quantity = formData.get("quantity") as string
  const price = formData.get("price") as string
  const userId = formData.get("user_id") as string

  const { data, error } = await supabase
    .from("sales")
    .insert([
      {
        product_id: product_id,
        quantity: Number.parseInt(quantity),
        price: Number.parseFloat(price),
        representative_id: userId, // Updated user_id to representative_id
      },
    ])
    .select()

  if (error) {
    console.error("Error registering sale:", error)
    return
  }

  revalidatePath("/sales")
  redirect("/sales")
}

export async function getSales() {
  const supabase = createClient()
  try {
    const { data: sales, error } = await supabase.from("sales").select(`
        id,
        quantity,
        price,
        created_at,
        products (
          name
        ),
        profiles (
          full_name
        )
    `)

    if (error) {
      console.error("Error fetching sales:", error)
      return []
    }

    return sales || []
  } catch (error) {
    console.error("Unexpected error fetching sales:", error)
    return []
  }
}

export async function getSalesByUser(userId: string) {
  const supabase = createClient()

  try {
    const { data: sales, error } = await supabase
      .from("sales")
      .select(`
            id,
            quantity,
            price,
            created_at,
            products (
              name
            )
        `)
      .eq("representative_id", userId) // Updated user_id to representative_id

    if (error) {
      console.error("Error fetching sales by user:", error)
      return []
    }

    return sales || []
  } catch (error) {
    console.error("Unexpected error fetching sales by user:", error)
    return []
  }
}

export async function deleteSale(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("sales").delete().eq("id", id)

  if (error) {
    console.error("Error deleting sale:", error)
    return
  }

  revalidatePath("/sales")
  redirect("/sales")
}

export async function updateAllTeamsPoints() {
  const supabase = createClient()

  try {
    // This function would need to be implemented based on your business logic
    // For now, returning a success response
    return { success: true }
  } catch (error: any) {
    console.error("Error updating team points:", error)
    return { success: false, error: error.message }
  }
}
