"use server"

import { createServerClient, adminSupabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/** Acepta decimales y coma como separador (p. ej. 12,5). */
function parseProductPoints(raw: unknown): number {
  const s = String(raw ?? "")
    .trim()
    .replace(",", ".")
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Los puntos deben ser un número mayor o igual a 0")
  }
  return n
}

/** kg o litros por unidad vendida; vacío = sin dato físico en listados. */
function parseProductContentFields(formData: FormData): {
  content_per_unit: number | null
  content_unit: "kg" | "l" | null
} {
  const rawAmount = (formData.get("content_per_unit") as string | null)?.trim() ?? ""
  const rawUnit = (formData.get("content_unit") as string | null)?.trim() ?? ""
  if (!rawAmount && !rawUnit) return { content_per_unit: null, content_unit: null }
  if (!rawAmount || !rawUnit) {
    throw new Error("Indica cantidad por unidad y unidad (kg o litros), o deja ambos campos vacíos")
  }
  const n = Number.parseFloat(rawAmount.replace(",", "."))
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("La cantidad por unidad debe ser un número mayor que 0")
  }
  if (rawUnit !== "kg" && rawUnit !== "l") {
    throw new Error("Unidad inválida: use kg o litros (l)")
  }
  return { content_per_unit: n, content_unit: rawUnit }
}

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
    const points = parseProductPoints(formData.get("points"))
    const { content_per_unit, content_unit } = parseProductContentFields(formData)
    const active = formData.get("active") === "true"
    const imageFile = formData.get("image") as File

    if (!name?.trim()) {
      throw new Error("El nombre es requerido")
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
        content_per_unit,
        content_unit,
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
    const points = parseProductPoints(formData.get("points"))
    const { content_per_unit, content_unit } = parseProductContentFields(formData)
    const active = formData.get("active") === "true"
    const imageFile = formData.get("image") as File
    const currentImageUrl = formData.get("currentImageUrl") as string

    if (!name?.trim()) {
      throw new Error("El nombre es requerido")
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
        content_per_unit,
        content_unit,
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

export async function getAllProducts() {
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
    console.error("Error en getAllProducts:", error)
    return { success: false, error: error.message }
  }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  try {
    // Service role: evita fallos por RLS al devolver filas tras UPDATE (p. ej. PGRST116 con .single()).
    const { data, error } = await adminSupabase
      .from("products")
      .update({
        active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")

    if (error) {
      throw new Error(`Error al cambiar estado del producto: ${error.message}`)
    }
    if (!data?.length) {
      throw new Error("No se actualizó ningún producto (id no encontrado)")
    }

    revalidatePath("/admin/productos")
    return { success: true, data: data[0] }
  } catch (error: any) {
    console.error("Error en toggleProductStatus:", error)
    return { success: false, error: error.message }
  }
}

// Función adicional para obtener productos simples (solo id y name)
export async function getProductsSimple() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, points, content_per_unit, content_unit")
      .eq("active", true)
      .order("name", { ascending: true })

    if (error) throw new Error(`Error al obtener productos: ${error.message}`)

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Error en getProductsSimple:", error)
    return { success: false, data: [], error: error.message }
  }
}
