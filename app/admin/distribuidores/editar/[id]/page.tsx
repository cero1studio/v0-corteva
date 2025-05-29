"use client"

import type React from "react"
import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getDistributorById, updateDistributor } from "@/app/actions/distributors"
import { getDistributorLogoUrl } from "@/lib/utils/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getZones } from "@/app/actions/zones"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarDistribuidorPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [distributor, setDistributor] = useState<{
    id: string
    name: string
    logo_url: string | null
    zone_id: string | null
  }>({
    id: "",
    name: "",
    logo_url: null,
    zone_id: null,
  })
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoKey, setLogoKey] = useState<number>(Date.now())
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (resolvedParams.id) {
      fetchDistributor(resolvedParams.id)
      fetchZones()
    }
  }, [resolvedParams.id])

  async function fetchDistributor(id: string) {
    try {
      setLoading(true)
      const data = await getDistributorById(id)

      if (data) {
        console.log("Distribuidor obtenido:", data)
        setDistributor({
          id: data.id,
          name: data.name,
          logo_url: data.logo_url,
          zone_id: data.zone_id,
        })

        // Configurar la vista previa del logo
        const logoUrl = getDistributorLogoUrl(data)
        console.log("URL del logo para preview:", logoUrl)
        setLogoPreview(logoUrl)
      }
    } catch (error) {
      console.error("Error al cargar distribuidor:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del distribuidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchZones() {
    try {
      const data = await getZones()
      setZones(data || [])
    } catch (error) {
      console.error("Error al cargar zonas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      })
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("Archivo seleccionado:", file.name, "Tamaño:", file.size)

    // Crear preview y forzar la actualización del componente Image
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log("Preview generado:", result.substring(0, 50) + "...")
      setLogoPreview(result)
      setLogoKey(Date.now()) // Actualizar la clave para forzar la actualización
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!distributor.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del distribuidor es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      // Crear FormData para enviar los datos
      const formData = new FormData()
      formData.append("name", distributor.name)
      if (distributor.zone_id) {
        formData.append("zoneId", distributor.zone_id)
      }

      // Añadir la URL actual del logo si existe
      if (distributor.logo_url) {
        formData.append("currentLogoUrl", distributor.logo_url)
      }

      // Añadir el archivo de logo si se seleccionó uno nuevo
      const logoInput = document.getElementById("logo") as HTMLInputElement
      if (logoInput.files && logoInput.files[0]) {
        console.log("Añadiendo archivo al FormData:", logoInput.files[0].name)
        formData.append("logo", logoInput.files[0])
      }

      // Enviar los datos al servidor
      console.log("Enviando datos al servidor...")
      const result = await updateDistributor(distributor.id, formData)

      if (result.success) {
        toast({
          title: "Distribuidor actualizado",
          description: "El distribuidor ha sido actualizado exitosamente",
        })
        router.push("/admin/distribuidores")
        router.refresh()
      } else {
        console.error("Error del servidor:", result.error)
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el distribuidor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar distribuidor:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el distribuidor",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/distribuidores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Editar Distribuidor</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del Distribuidor</CardTitle>
            <CardDescription>Actualiza la información del distribuidor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Distribuidor</Label>
              <Input
                id="name"
                value={distributor.name}
                onChange={(e) => setDistributor({ ...distributor, name: e.target.value })}
                placeholder="Nombre del distribuidor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zoneId">Zona</Label>
              <Select
                name="zoneId"
                value={distributor.zone_id || ""}
                onValueChange={(value) => setDistributor({ ...distributor, zone_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative h-20 w-40 overflow-hidden rounded-md border">
                    <Image
                      key={logoKey}
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        console.error("Error al cargar preview:", logoPreview)
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                      onLoad={() => {
                        console.log("Preview cargado exitosamente:", logoPreview)
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-40 items-center justify-center rounded-md border bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Formatos aceptados: JPG, PNG. Tamaño máximo: 5MB</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/distribuidores">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
