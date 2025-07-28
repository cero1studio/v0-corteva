"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

interface Team {
  id: string
  name: string
  zone_id: string
  captain_id: string
  zones?: { name: string }
  profiles?: { full_name: string }
}

interface Zone {
  id: string
  name: string
}

export default function EditTeamPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    zone_id: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar equipo con información del capitán
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select(`
            *,
            zones(name),
            profiles!captain_id(full_name)
          `)
          .eq("id", teamId)
          .single()

        if (teamError) throw teamError

        if (teamData) {
          setTeam(teamData)
          setFormData({
            name: teamData.name,
            zone_id: teamData.zone_id,
          })
        }

        // Cargar zonas
        const { data: zonesData } = await supabase.from("zones").select("id, name").order("name")
        if (zonesData) setZones(zonesData)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del equipo",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [teamId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: formData.name,
          zone_id: formData.zone_id,
        })
        .eq("id", teamId)

      if (error) throw error

      toast({
        title: "Equipo actualizado",
        description: "El equipo ha sido actualizado correctamente",
      })
      router.push("/admin/equipos")
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el equipo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/equipos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cargando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/equipos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se pudo encontrar el equipo solicitado.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/equipos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Equipo</h2>
          <p className="text-muted-foreground">Modifica la información del equipo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Equipo</CardTitle>
          <CardDescription>Actualiza los datos del equipo seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Equipo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ingresa el nombre del equipo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">Zona</Label>
              <Select value={formData.zone_id} onValueChange={(value) => setFormData({ ...formData, zone_id: value })}>
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

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/equipos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
