"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { assignPenalty } from "@/app/actions/penalties"
import { PenaltyAnimation } from "@/components/penalty-animation"

interface Team {
  id: string
  name: string
}

interface PenaltyAssignFormProps {
  teams?: Team[]
}

export function PenaltyAssignForm({ teams = [] }: PenaltyAssignFormProps) {
  const [teamId, setTeamId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamId || quantity < 1) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await assignPenalty(teamId, quantity, reason)

      if (result.success) {
        setShowAnimation(true)
        setTeamId("")
        setQuantity(1)
        setReason("")
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo asignar el penalti",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al asignar penalti:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnimationComplete = () => {
    setShowAnimation(false)
    toast({
      title: "Penalti asignado",
      description: "El penalti ha sido asignado correctamente",
    })
    router.refresh()
  }

  // Datos de ejemplo para la demo
  const demoTeams =
    teams.length > 0
      ? teams
      : [
          { id: "1", name: "Equipo Norte" },
          { id: "2", name: "Equipo Sur" },
          { id: "3", name: "Equipo Este" },
          { id: "4", name: "Equipo Oeste" },
        ]

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team">Equipo</Label>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger id="team">
              <SelectValue placeholder="Selecciona un equipo" />
            </SelectTrigger>
            <SelectContent>
              {demoTeams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea
            id="reason"
            placeholder="Describe el motivo del penalti"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Asignando..." : "Asignar Penalti"}
        </Button>
      </form>

      <PenaltyAnimation show={showAnimation} onComplete={handleAnimationComplete} />
    </>
  )
}
