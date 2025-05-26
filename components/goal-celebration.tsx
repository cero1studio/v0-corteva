"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import Confetti from "react-confetti"
import { useEffect, useState } from "react"

interface GoalCelebrationProps {
  isOpen: boolean
  onClose: () => void
  goalCount: number
  productName: string
  totalPoints: number
  pointsPerGoal: number
}

export function GoalCelebration({
  isOpen,
  onClose,
  goalCount,
  productName,
  totalPoints,
  pointsPerGoal,
}: GoalCelebrationProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [showBall, setShowBall] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })

      // Mostrar animación del balón después de un pequeño delay
      setTimeout(() => setShowBall(true), 300)
    } else {
      setShowBall(false)
    }
  }, [isOpen])

  // Calcular puntos extra y mensaje
  const extraPoints = totalPoints % pointsPerGoal
  const pointsNeeded = pointsPerGoal - extraPoints

  const getMotivationalMessage = () => {
    if (goalCount > 0 && extraPoints > 0) {
      return `¡${goalCount} ${goalCount === 1 ? "gol anotado" : "goles anotados"} y ${extraPoints} puntos extras! Completa ${pointsNeeded} puntos más para anotar otro gol.`
    } else if (goalCount > 0 && extraPoints === 0) {
      return `¡${goalCount} ${goalCount === 1 ? "gol perfecto" : "goles perfectos"}! Sigue así para mantener el ritmo.`
    } else if (extraPoints > 0) {
      return `¡Pegaste en el palo! Tienes ${extraPoints} puntos. Te faltan ${pointsNeeded} puntos más para anotar un gol.`
    } else {
      return "¡Sigue registrando ventas para anotar tu primer gol!"
    }
  }

  const getCelebrationTitle = () => {
    if (goalCount > 0) {
      return "¡GOOOOOL!"
    } else {
      return "¡Casi!"
    }
  }

  const getCelebrationColor = () => {
    if (goalCount > 0) {
      return "text-corteva-600"
    } else {
      return "text-yellow-600"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center p-0 overflow-hidden bg-transparent border-none shadow-none">
        {/* Confetti solo si hay goles */}
        {isOpen && goalCount > 0 && (
          <Confetti
            width={dimensions.width}
            height={dimensions.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        )}

        <div className="bg-white rounded-lg p-6 shadow-lg relative z-10 border">
          {/* Animación del balón */}
          <div className="mb-4 relative h-24 overflow-hidden">
            <div
              className={`mx-auto w-24 h-24 rounded-full bg-corteva-50 flex items-center justify-center transition-all duration-1000 ${
                showBall ? "transform translate-y-0 scale-100" : "transform -translate-y-32 scale-50"
              }`}
            >
              <div className={`transition-all duration-500 ${showBall ? "animate-bounce" : ""}`}>
                <img src="/soccer-ball.png" alt="Balón" className="h-16 w-16" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">{getCelebrationTitle()}</h2>

          {goalCount > 0 && <p className={`text-4xl font-bold mb-4 ${getCelebrationColor()}`}>+{goalCount}</p>}

          <p className="text-muted-foreground mb-4">
            ¡Felicidades! Has registrado una venta de <span className="font-medium">{productName}</span>.
          </p>

          {/* Información detallada de puntos */}
          <div className="bg-corteva-50 p-4 rounded-md border border-corteva-100 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-corteva-700 font-medium">Total puntos:</span>
                <p className="text-lg font-bold text-corteva-800">{totalPoints}</p>
              </div>
              <div>
                <span className="text-corteva-700 font-medium">Goles anotados:</span>
                <p className="text-lg font-bold text-corteva-800">{goalCount}</p>
              </div>
            </div>

            {extraPoints > 0 && (
              <div className="border-t border-corteva-200 pt-3">
                <span className="text-corteva-700 font-medium">Puntos extra:</span>
                <p className="text-lg font-bold text-corteva-800">{extraPoints}</p>
                <div className="w-full bg-corteva-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-corteva-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(extraPoints / pointsPerGoal) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-corteva-600 mt-1">
                  {extraPoints}/{pointsPerGoal} puntos para el próximo gol
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
            <p className="text-sm text-blue-700">{getMotivationalMessage()}</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-corteva-600 text-white rounded-md hover:bg-corteva-700 transition-colors"
          >
            ¡Entendido!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
