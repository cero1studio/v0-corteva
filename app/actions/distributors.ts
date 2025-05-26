"use server"

import { createServerClient } from "@/lib/supabase/server"
import { adminSupabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createDistributor(formData: FormData) {
  const supabase = createServerClient()

  // Obtener datos del formulario
  const name = formData.get("name") as string
  const address = formData.get("address") as string
  const contactName = formData.get("contactName") as string
  const contactEmail = formData.get("contactEmail") as string
  const contactPhone = formData.get("contactPhone") as string
  const imageFile = formData.get("logo") as File

  try {
    let logoUrl = null

    // Subir imagen si se proporciona
    if (imageFile && imageFile.size > 0) {
      console.log("Subiendo imagen:", imageFile.name, "Tamaño:", imageFile.size)

      const fileExt = imageFile.name.split(".").pop()
      const fileName = `distributor_${Date.now()}.${fileExt}`
      const filePath = `distributors/${fileName}`

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from("images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        return { error: `Error al subir imagen: ${uploadError.message}` }
      }

      console.log("Imagen subida exitosamente:", uploadData.path)
      logoUrl = uploadData.path
    }

    const { data, error } = await supabase
      .from("distributors")
      .insert({
        name,
        address,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        logo_url: logoUrl,
      })
      .select()
      .single()

    if (error) {
      console.error("Error al crear distribuidor:", error)
      return { error: error.message }
    }

    console.log("Distribuidor creado:", data)
    revalidatePath("/admin/distribuidores")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error general:", error)
    return { error: error.message || "Error al crear el distribuidor" }
  }
}

export async function getDistributors() {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("distributors").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error al obtener distribuidores:", error)
    return []
  }

  return data
}

export async function getDistributorById(id: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("distributors").select("*").eq("id", id).single()

  if (error) {
    console.error("Error al obtener distribuidor:", error)
    return null
  }

  return data
}

export async function updateDistributor(id: string, formData: FormData) {
  const supabase = createServerClient()

  const name = formData.get("name") as string
  const address = (formData.get("address") as string) || null
  const contactName = (formData.get("contactName") as string) || null
  const contactEmail = (formData.get("contactEmail") as string) || null
  const contactPhone = (formData.get("contactPhone") as string) || null
  const imageFile = formData.get("logo") as File
  const currentLogoUrl = (formData.get("currentLogoUrl") as string) || null

  try {
    let logoUrl = currentLogoUrl

    // Subir nueva imagen si se proporciona
    if (imageFile && imageFile.size > 0) {
      console.log("Actualizando imagen:", imageFile.name, "Tamaño:", imageFile.size)

      const fileExt = imageFile.name.split(".").pop()
      const fileName = `distributor_${Date.now()}.${fileExt}`
      const filePath = `distributors/${fileName}`

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from("images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error al subir nueva imagen:", uploadError)
        return { error: `Error al subir imagen: ${uploadError.message}` }
      }

      console.log("Nueva imagen subida:", uploadData.path)

      // Eliminar imagen anterior si existe
      if (currentLogoUrl) {
        console.log("Eliminando imagen anterior:", currentLogoUrl)
        const { error: deleteError } = await adminSupabase.storage.from("images").remove([currentLogoUrl])
        if (deleteError) {
          console.error("Error al eliminar imagen anterior:", deleteError)
        }
      }

      logoUrl = uploadData.path
    }

    const { data, error } = await supabase
      .from("distributors")
      .update({
        name,
        address,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar distribuidor:", error)
      return { error: error.message }
    }

    console.log("Distribuidor actualizado:", data)
    revalidatePath("/admin/distribuidores")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error general al actualizar:", error)
    return { error: error.message || "Error al actualizar el distribuidor" }
  }
}

export async function deleteDistributor(distributorId: string) {
  const supabase = createServerClient()

  try {
    // Obtener información del distribuidor para eliminar la imagen
    const { data: distributor } = await supabase
      .from("distributors")
      .select("logo_url")
      .eq("id", distributorId)
      .single()

    // Eliminar distribuidor
    const { error } = await supabase.from("distributors").delete().eq("id", distributorId)

    if (error) {
      return { error: error.message }
    }

    // Eliminar imagen si existe
    if (distributor?.logo_url) {
      console.log("Eliminando imagen del distribuidor:", distributor.logo_url)
      const { error: deleteError } = await adminSupabase.storage.from("images").remove([distributor.logo_url])
      if (deleteError) {
        console.error("Error al eliminar imagen:", deleteError)
      }
    }

    revalidatePath("/admin/distribuidores")
    return { success: true }
  } catch (error: any) {
    console.error("Error al eliminar distribuidor:", error)
    return { error: error.message || "Error al eliminar el distribuidor" }
  }
}
