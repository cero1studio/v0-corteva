"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createProduct } from "@/app/actions/products"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import Image from "next/image"

export default function NuevoProductoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points: "0",
    active: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }))
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

      // Añadir datos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value.toString())
      })

      // Añadir la imagen si existe
      const imageInput = document.getElementById("product-image") as HTMLInputElement
      if (imageInput.files && imageInput.files[0]) {
        formDataObj.append("image", imageInput.files[0])
      }

      console.log("Enviando formulario con imagen:", imageInput.files?.[0]?.name)

      const result = await createProduct(formDataObj)

      if (result.success) {
        toast({
          title: "Producto creado",
          description: "El producto ha sido creado exitosamente",
        })
        router.push("/admin/productos")
      } else {
        toast({
          title: "Error",
          description: result.error || "Ha ocurrido un error al crear el producto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Ha ocurrido un error al crear el producto",
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
          <CardTitle>Nuevo Producto</CardTitle>
          <CardDescription>Crea un nuevo producto para la venta</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Producto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Nombre del producto"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descripción del producto"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">
                Puntos <span className="text-red-500">*</span>
              </Label>
              <Input
                id="points"
                name="points"
                type="number"
                placeholder="Puntos que otorga el producto"
                value={formData.points}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-image">Imagen del Producto</Label>
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
                    id="product-image"
                    name="image"
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

            <div className="flex items-center space-x-2">
              <Switch id="active" checked={formData.active} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="active">Producto activo</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/productos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-corteva-500 hover:bg-corteva-600">
              {isLoading ? "Creando..." : "Crear Producto"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
