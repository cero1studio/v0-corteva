"use server"

import { createServerClient, adminSupabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getProducts() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(`Error al obtener productos: ${error.message}`)

    // Procesar las URLs de las imágenes para asegurar que son URLs completas
    const productsWithImages = data.map((product) => {
      if (product.image_url && !product.image_url.startsWith("http") && !product.image_url.startsWith("/")) {
        // Construir URL completa para el bucket de Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        product.image_url = `${supabaseUrl}/storage/v1/object/public/images/${product.image_url}`
      }
      return product
    })

    return { success: true, data: productsWithImages }
  } catch (error: any) {
    console.error("Error en getProducts:", error)
    return { success: false, error: error.message }
  }
}

export async function getProductById(id: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) throw new Error(`Error al obtener producto: ${error.message}`)

    // Procesar la URL de la imagen
    if (data && data.image_url && !data.image_url.startsWith("http") && !data.image_url.startsWith("/")) {
      // Construir URL completa para el bucket de Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      data.image_url = `${supabaseUrl}/storage/v1/object/public/images/${data.image_url}`
    }

    return data
  } catch (error: any) {
    console.error("Error en getProductById:", error)
    return null
  }
}

export async function createProduct(formData: FormData) {
  const supabase = createServerClient()

  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const points = Number.parseInt(formData.get("points") as string)
    const active = formData.get("active") === "true"
    const imageFile = formData.get("image") as File

    if (!name || isNaN(points)) {
      throw new Error("El nombre y los puntos son requeridos")
    }

    let imageUrl = null

    // Subir imagen si existe usando adminSupabase
    if (imageFile && imageFile.size > 0) {
      console.log("Subiendo imagen:", imageFile.name, "Tamaño:", imageFile.size)

      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from("images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        throw new Error(`Error al subir imagen: ${uploadError.message}`)
      }

      console.log("Imagen subida exitosamente:", uploadData?.path)
      imageUrl = uploadData?.path || null
    }

    // Crear producto
    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description,
        points,
        active,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear producto: ${error.message}`)

    revalidatePath("/admin/productos")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error en createProduct:", error)
    return { success: false, error: error.message }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createServerClient()

  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const points = Number.parseInt(formData.get("points") as string)
    const active = formData.get("active") === "true"
    const imageFile = formData.get("image") as File
    const currentImageUrl = formData.get("currentImageUrl") as string

    if (!name || isNaN(points)) {
      throw new Error("El nombre y los puntos son requeridos")
    }

    let imageUrl = currentImageUrl

    // Subir nueva imagen si existe usando adminSupabase
    if (imageFile && imageFile.size > 0) {
      console.log("Actualizando imagen:", imageFile.name, "Tamaño:", imageFile.size)

      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from("images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError)
        throw new Error(`Error al subir imagen: ${uploadError.message}`)
      }

      console.log("Imagen subida exitosamente:", uploadData?.path)

      // Eliminar imagen anterior si existe usando adminSupabase
      if (currentImageUrl && !currentImageUrl.startsWith("/placeholder")) {
        try {
          // Extraer el nombre del archivo de la URL
          const fileName = currentImageUrl.split("/").pop()
          if (fileName) {
            console.log("Eliminando imagen anterior:", fileName)
            await adminSupabase.storage.from("images").remove([fileName])
          }
        } catch (removeError) {
          console.error("Error al eliminar imagen anterior:", removeError)
          // Continuamos aunque falle la eliminación
        }
      }

      imageUrl = uploadData?.path || null
    }

    // Actualizar producto
    const { data, error } = await supabase
      .from("products")
      .update({
        name,
        description,
        points,
        active,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar producto: ${error.message}`)

    revalidatePath("/admin/productos")
    revalidatePath(`/admin/productos/editar/${id}`)
    return { success: true, data }
  } catch (error: any) {
    console.error("Error en updateProduct:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteProduct(id: string) {
  const supabase = createServerClient()

  try {
    // Obtener información del producto para eliminar la imagen
    const { data: product } = await supabase.from("products").select("image_url").eq("id", id).single()

    // Eliminar imagen si existe usando adminSupabase
    if (product?.image_url && !product.image_url.startsWith("/placeholder")) {
      try {
        // Extraer el nombre del archivo de la URL
        const fileName = product.image_url.split("/").pop()
        if (fileName) {
          console.log("Eliminando imagen:", fileName)
          await adminSupabase.storage.from("images").remove([fileName])
        }
      } catch (removeError) {
        console.error("Error al eliminar imagen:", removeError)
        // Continuamos aunque falle la eliminación
      }
    }

    // Eliminar producto
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) throw new Error(`Error al eliminar producto: ${error.message}`)

    revalidatePath("/admin/productos")
    return { success: true }
  } catch (error: any) {
    console.error("Error en deleteProduct:", error)
    return { success: false, error: error.message }
  }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .update({
        active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Error al cambiar estado del producto: ${error.message}`)

    revalidatePath("/admin/productos")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error en toggleProductStatus:", error)
    return { success: false, error: error.message }
  }
}
