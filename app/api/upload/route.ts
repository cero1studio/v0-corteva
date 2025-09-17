import { type NextRequest, NextResponse } from "next/server"
import { adminSupabase } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Generar nombre de archivo único
    const fileExt = file.name.split(".").pop()
    const fileName = `${folder}-${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Subir el archivo usando el cliente administrativo del servidor
    const { data, error } = await adminSupabase.storage.from("images").upload(filePath, buffer, {
      contentType: file.type,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Devolver la ruta relativa del archivo
    return NextResponse.json({ path: filePath })
  } catch (error) {
    console.error("Error in upload API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
