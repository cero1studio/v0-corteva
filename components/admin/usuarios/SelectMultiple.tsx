"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"

interface Zone {
  id: string
  name: string
}

interface Distributor {
  id: string
  name: string
}

interface SelectMultipleZonasProps {
  setSelectedZone: (zoneId: string) => void
}

interface SelectMultipleDistribuidoresProps {
  setSelectedDistributor: (distributorId: string) => void
}

export function SelectMultipleZonas({ setSelectedZone }: SelectMultipleZonasProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchZones() {
      try {
        const { data, error } = await supabase.from("zones").select("id, name").order("name")

        if (error) throw error
        setZones(data || [])
      } catch (error) {
        console.error("Error al cargar zonas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchZones()
  }, [])

  return (
    <Select onValueChange={setSelectedZone}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Cargando..." : "Selecciona una zona"} />
      </SelectTrigger>
      <SelectContent>
        {zones.map((zone) => (
          <SelectItem key={zone.id} value={zone.id}>
            {zone.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function SelectMultipleDistribuidores({ setSelectedDistributor }: SelectMultipleDistribuidoresProps) {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDistributors() {
      try {
        const { data, error } = await supabase.from("distributors").select("id, name").order("name")

        if (error) throw error
        setDistributors(data || [])
      } catch (error) {
        console.error("Error al cargar distribuidores:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDistributors()
  }, [])

  return (
    <Select onValueChange={setSelectedDistributor}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Cargando..." : "Selecciona un distribuidor"} />
      </SelectTrigger>
      <SelectContent>
        {distributors.map((distributor) => (
          <SelectItem key={distributor.id} value={distributor.id}>
            {distributor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
