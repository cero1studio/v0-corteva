"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Building, Upload } from "lucide-react"
import Link from "next/link"

export default function NuevoDistribuidorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [distributor, setDistributor] = useState({
    name: "",
    logo_url: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          variant: "destructive",
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null

    setUploading(true)
    try {
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `distributor-${Date.now()}.${fileExt}`
      const filePath = `distributors/${fileName}`

      console.log("Subiendo imagen:", filePath) // Debug

      const { error: uploadError } = await supabase.storage.from("distributor-logos").upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        toast({
          title: "Error al subir imagen",
          description: uploadError.message,
          variant: "destructive",
        })
        return null
      }

      // Verificar que la imagen se subió correctamente
      const { data: publicUrlData } = supabase.storage.from("distributor-logos").getPublicUrl(filePath)

      console.log("URL pública generada:", publicUrlData.publicUrl) // Debug

      return filePath // Guardamos la ruta, no la URL completa
    } catch (error) {
      console.error("Error in uploadImage:", error)
      toast({
        title: "Error",
        description: "Error inesperado al subir la imagen",
        variant: "destructive",
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!distributor.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del distribuidor es requerido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let logoUrl = distributor.logo_url

      // Si hay una imagen seleccionada, subirla primero
      if (selectedFile) {
        const uploadedPath = await uploadImage()
        if (uploadedPath) {
          logoUrl = uploadedPath
        } else {
          setLoading(false)
          return // El error ya se mostró en uploadImage
        }
      }

      console.log("Creando distribuidor con logo_url:", logoUrl) // Debug

      const { data, error } = await supabase
        .from("distributors")
        .insert({
          name: distributor.name.trim(),
          logo_url: logoUrl || null,
        })
        .select()

      if (error) {
        console.error("Error creating distributor:", error)
        throw error
      }

      console.log("Distribuidor creado:", data) // Debug

      toast({
        title: "Distribuidor creado",
        description: "El distribuidor ha sido creado exitosamente",
      })

      router.push("/admin/distribuidores")
    } catch (error) {
      console.error("Error creating distributor:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el distribuidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/distribuidores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Distribuidor</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Crear Distribuidor
          </CardTitle>
          <CardDescription>Ingresa la información del nuevo distribuidor</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del distribuidor *</Label>
              <Input
                id="name"
                value={distributor.name}
                onChange={(e) => setDistributor({ ...distributor, name: e.target.value })}
                placeholder="Ej: Distribuidora Norte"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo del distribuidor</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="cursor-pointer flex-1"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4 animate-pulse" />
                      Subiendo...
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecciona una imagen para el logo del distribuidor (PNG, JPG, etc. - Máximo 5MB)
                </p>

                {previewUrl && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                    <div className="w-16 h-16 border rounded-lg overflow-hidden bg-white">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Vista previa"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Vista previa</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedFile?.name} ({(selectedFile?.size || 0 / 1024).toFixed(1)} KB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/distribuidores")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading || uploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {uploading ? "Subiendo imagen..." : "Creando..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Distribuidor
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
