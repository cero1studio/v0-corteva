"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface ClientGoalCelebrationProps {
  isOpen: boolean
  onClose: () => void
  goalCount: number
  clientName: string
}

export function ClientGoalCelebration({ isOpen, onClose, goalCount, clientName }: ClientGoalCelebrationProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true)
      // Ya no hay auto-cierre
    } else {
      setShowAnimation(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardContent className="p-6 text-center space-y-4">
          {/* Soccer Ball Animation - usando el mismo PNG */}
          <div className="relative">
            <div
              className={`w-20 h-20 mx-auto mb-4 transition-all duration-1000 ${showAnimation ? "animate-bounce" : ""}`}
            >
              <Image
                src="/soccer-ball.png"
                alt="Soccer Ball"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Goal Text con efectos */}
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-green-600 animate-pulse">¡GOOOOOL!</h2>
            <div className="text-5xl font-bold text-blue-600 animate-bounce">+{goalCount}</div>
          </div>

          {/* Congratulations Message */}
          <div className="space-y-2">
            <p className="text-lg text-gray-700 font-medium">
              ¡Felicidades! Has registrado a <span className="font-semibold text-blue-600">{clientName}</span> de la
              competencia.
            </p>
          </div>

          {/* Goals Scored */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{goalCount} goles</p>
              <p className="text-sm text-gray-500">({goalCount * 100} puntos)</p>
            </div>
          </div>

          {/* Encouragement Message */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              🎯 ¡Sigue registrando clientes de la competencia para anotar más goles!
            </p>
          </div>

          {/* Close Button */}
          <div className="pt-3">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 text-lg"
            >
              ¡Continuar! 🚀
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
