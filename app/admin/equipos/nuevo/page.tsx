"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTeam } from "@/app/actions/teams"
import { getZones } from "@/app/actions/zones"
import { getDistributors } from "@/app/actions/distributors"
import { getCaptains } from "@/app/actions/captains"
import { supabase } from "@/lib/supabase/client"

interface Zone {
  id: string
  name: string
}

interface Distributor {
  id: string
  name: string
}

interface Captain {
  id: string
  name: string
}

export default function NuevoEquipoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [captains, setCaptains] = useState<Captain[]>([])
  const [zoneId, setZoneId] = useState("")
  const [distributorId, setDistributorId] = useState("")
  const [captainId, setCaptainId] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const zonesData = await getZones()
        const distributorsData = await getDistributors()
        const captainsData = await getCaptains()
        setZones(zonesData)
        setDistributors(distributorsData)
        setCaptains(captainsData)
      } catch (err) {
        console.error("Error al cargar datos:", err)
      }
    }

    fetchData()
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    if (formData.get("captain_id")) {
      const captainId = formData.get("captain_id") as string
      const { data: captainData, error } = await supabase
        .from("profiles")
        .select("distributor_id, zone_id")
        .eq("id", captainId)
        .single()

      if (!error && captainData) {
        if (captainData.distributor_id) {
          formData.set("distributor_id", captainData.distributor_id)
        }
        if (captainData.zone_id) {
          formData.set("zone_id", captainData.zone_id)
        }
      }
    }

    try {
      const result = await createTeam(formData)

      if (result.error) {
        setError(result.error)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        toast({
          title: "Equipo creado",
          description: "El equipo ha sido creado exitosamente",
        })
        router.push("/admin/equipos")
      }
    } catch (err: any) {
      setError(err.message || "Error al crear el equipo")
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Error al crear el equipo",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Nuevo Equipo</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Crear Equipo</CardTitle>
          <CardDescription>Ingresa los datos del nuevo equipo</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Equipo</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="captain_id">Capitán</Label>
              <Select name="captain_id" value={captainId} onValueChange={setCaptainId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un capitán" />
                </SelectTrigger>
                <SelectContent>
                  {captains.map((captain) => (
                    <SelectItem key={captain.id} value={captain.id}>
                      {captain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone_id">Zona</Label>
              <Select name="zone_id" value={zoneId} onValueChange={setZoneId} required>
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
              <Label htmlFor="distributor_id">Distribuidor</Label>
              <Select name="distributor_id" value={distributorId} onValueChange={setDistributorId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un distribuidor" />
                </SelectTrigger>
                <SelectContent>
                  {distributors.map((distributor) => (
                    <SelectItem key={distributor.id} value={distributor.id}>
                      {distributor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Meta (puntos)</Label>
              <Input id="goal" name="goal" type="number" min="1" required />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Creando..." : "Crear Equipo"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
