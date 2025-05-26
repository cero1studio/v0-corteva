"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { usePenalty } from "@/app/actions/penalties"

interface UsePenaltyFormProps {
  teamId: string
  availablePenalties: number
}

export function UsePenaltyForm({ teamId, availablePenalties }: UsePenaltyFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (quantity < 1) {
      toast({
        title: "Error",
        description: "La cantidad debe ser al menos 1",
        variant: "destructive",
      })
      return
    }

    if (quantity > availablePenalties) {
      toast({
        title: "Error",
        description: `Solo tienes ${availablePenalties} penaltis disponibles`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const penaltyResult = await usePenalty(teamId, quantity, description)
      setResult(penaltyResult)

      if (penaltyResult.success) {
        toast({
          title: "Penaltis utilizados",
          description: `Has utilizado ${quantity} penaltis correctamente`,
        })
        setQuantity(1)
        setDescription("")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: penaltyResult.error || "No se pudieron utilizar los penaltis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al utilizar penaltis:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad a utilizar</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={availablePenalties}
          value={quantity}
          onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
        />
        <p className="text-sm text-muted-foreground">Tienes {availablePenalties} penaltis disponibles</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          placeholder="Describe para qué utilizarás los penaltis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || availablePenalties === 0}>
        {isSubmitting ? "Procesando..." : "Utilizar Penaltis"}
      </Button>
    </form>
  )
}
