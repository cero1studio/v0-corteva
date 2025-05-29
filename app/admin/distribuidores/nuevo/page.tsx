"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createDistributor } from "@/app/actions/distributors"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import Image from "next/image"

export default function NuevoDistribuidorPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no debe superar los 2MB",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "El archivo debe ser una imagen",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append("name", formData.name)

      // Añadir la imagen si existe
      const imageInput = document.getElementById("logo") as HTMLInputElement
      if (imageInput.files && imageInput.files[0]) {
        formDataObj.append("logo", imageInput.files[0])
      }

      console.log("Enviando formulario con imagen:", imageInput.files?.[0]?.name)

      const result = await createDistributor(formDataObj)

      if (result.success) {
        toast({
          title: "Distribuidor creado",
          description: "El distribuidor ha sido creado exitosamente",
        })
        router.push("/admin/distribuidores")
      } else {
        toast({
          title: "Error",
          description: result.error || "Ha ocurrido un error al crear el distribuidor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Ha ocurrido un error al crear el distribuidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Distribuidor</CardTitle>
          <CardDescription>Completa el formulario para crear un nuevo distribuidor en el sistema</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Distribuidor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Nombre del distribuidor"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo del Distribuidor</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-md border bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/distribuidores")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-corteva-500 hover:bg-corteva-600">
              {isLoading ? "Creando..." : "Crear Distribuidor"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
