"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Building } from "lucide-react"
import Link from "next/link"

interface Distributor {
  id: string
  name: string
  logo_url?: string
  created_at: string
}

export default function EditarDistribuidorPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [distributor, setDistributor] = useState<Distributor | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (params.id) {
      fetchDistributor(params.id as string)
    }
  }, [params.id])

  const fetchDistributor = async (id: string) => {
    try {
      const { data, error } = await supabase.from("distributors").select("*").eq("id", id).single()

      if (error) throw error

      setDistributor(data)
      if (data.logo_url) {
        setPreviewUrl(data.logo_url)
      }
    } catch (error) {
      console.error("Error fetching distributor:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el distribuidor",
        variant: "destructive",
      })
      router.push("/admin/distribuidores")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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

      const { error: uploadError } = await supabase.storage.from("distributor-logos").upload(filePath, selectedFile)

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        return null
      }

      const { data } = supabase.storage.from("distributor-logos").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Error in uploadImage:", error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!distributor || !distributor.name.trim()) {
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
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          logoUrl = uploadedUrl
        } else {
          toast({
            title: "Error",
            description: "No se pudo subir la imagen. Intenta de nuevo.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      const { error } = await supabase
        .from("distributors")
        .update({
          name: distributor.name.trim(),
          logo_url: logoUrl || null,
        })
        .eq("id", distributor.id)

      if (error) throw error

      toast({
        title: "Distribuidor actualizado",
        description: "El distribuidor ha sido actualizado exitosamente",
      })

      router.push("/admin/distribuidores")
    } catch (error) {
      console.error("Error updating distributor:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el distribuidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="max-w-2xl">
          <div className="rounded-lg border p-6 space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!distributor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/distribuidores">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Distribuidor no encontrado</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/distribuidores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Editar Distribuidor</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Editar {distributor.name}
          </CardTitle>
          <CardDescription>Modifica la información del distribuidor</CardDescription>
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
                <Input id="logo" type="file" accept="image/*" onChange={handleFileSelect} className="cursor-pointer" />
                <p className="text-xs text-muted-foreground">Selecciona una nueva imagen para cambiar el logo actual</p>

                {previewUrl && (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 border rounded-lg overflow-hidden bg-white">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Vista previa"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=64&width=64&text=Logo"
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedFile ? "Nueva imagen" : "Imagen actual"}
                    </span>
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
                    {uploading ? "Subiendo imagen..." : "Actualizando..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Actualizar Distribuidor
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
