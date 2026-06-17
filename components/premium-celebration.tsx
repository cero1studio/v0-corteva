"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-confetti"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PremiumCelebrationProps {
  isOpen: boolean
  onClose: () => void
  type: "sale" | "client"
  goalCount: number
  extraPoints?: number
  pointsNeeded?: number
  clientName?: string
}

export function PremiumCelebration({
  isOpen,
  onClose,
  type,
  goalCount,
  extraPoints = 0,
  pointsNeeded = 0,
  clientName = "",
}: PremiumCelebrationProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
      if (goalCount > 0) {
        setShowConfetti(true)
        // Auto-stop confetti generator after 3 seconds but let pieces fall
        const timer = setTimeout(() => setShowConfetti(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, goalCount])

  if (!isOpen) return null

  const isGoal = goalCount > 0
  const isPost = type === "sale" && goalCount === 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {showConfetti && (
            <div className="pointer-events-none fixed inset-0 z-50">
              <Confetti
                width={dimensions.width}
                height={dimensions.height}
                recycle={true}
                numberOfPieces={showConfetti ? 400 : 0}
                gravity={0.15}
                colors={['#10b981', '#3b82f6', '#f59e0b', '#ffffff', '#042b4d']}
                initialVelocityY={20}
              />
            </div>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={
              isPost
                ? {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    x: [0, -10, 10, -10, 10, 0], // Shake effect for post
                    transition: { duration: 0.5, x: { duration: 0.4, repeat: 0 } },
                  }
                : { scale: 1, opacity: 1, y: 0, transition: { type: "spring", bounce: 0.5, duration: 0.8 } }
            }
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="relative z-50 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header / Animation Area */}
            <div className={`relative flex h-48 items-end justify-center overflow-hidden pb-4 ${isPost ? 'bg-amber-100' : 'bg-gradient-to-br from-corteva-400 to-corteva-600'}`}>
              {/* Goal Net Background (Sale - Goal) */}
              {type === "sale" && isGoal && (
                <div className="absolute inset-0 opacity-20">
                  <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
                </div>
              )}
              
              {/* Ball Animation */}
              {type === "sale" && (
                <motion.div
                  initial={isGoal ? { y: 150, x: -50, scale: 0.5, rotate: -180 } : { y: 150, scale: 0.8 }}
                  animate={isGoal ? { y: 0, x: 0, scale: 1.5, rotate: 0 } : { y: 20, scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.2 }}
                  className="relative z-10"
                >
                  <Image src="/soccer-ball.png" alt="Balón" width={isGoal ? 100 : 80} height={isGoal ? 100 : 80} className="drop-shadow-2xl" />
                </motion.div>
              )}

              {/* Transfer Animation (Client) */}
              {type === "client" && (
                <motion.div
                  initial={{ y: 100, scale: 0.5, rotateY: 180 }}
                  animate={{ y: 0, scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", bounce: 0.4, duration: 1, delay: 0.2 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div className="relative mb-2 rounded-xl bg-white/20 p-4 shadow-[0_0_30px_rgba(255,255,255,0.5)] backdrop-blur-md border border-white/40">
                    <Image src="/logo.png" alt="Corteva" width={80} height={30} className="opacity-90" />
                  </div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-yellow-900 shadow-lg"
                  >
                    NUEVO FICHAJE
                  </motion.div>
                </motion.div>
              )}

              {/* Hit the Post Effect */}
              {isPost && (
                <div className="absolute top-0 right-0 h-full w-4 bg-amber-500 shadow-[-5px_0_15px_rgba(0,0,0,0.2)]"></div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-8 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`mb-2 text-4xl font-extrabold ${isPost ? 'text-amber-600' : 'text-corteva-600'}`}
              >
                {type === "client" && "¡FICHAJE ESTRELLA!"}
                {type === "sale" && isGoal && "¡GOOOOOL!"}
                {type === "sale" && isPost && "¡PALO!"}
              </motion.h2>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 text-lg text-gray-600"
              >
                {type === "client" && (
                  <>
                    <p>Has incorporado a <span className="font-bold text-gray-900">{clientName}</span> a tu equipo.</p>
                    <div className="mx-auto inline-block rounded-xl bg-green-50 px-6 py-3 border border-green-200">
                      <p className="text-3xl font-black text-green-600">+{goalCount} GOLES</p>
                    </div>
                  </>
                )}

                {type === "sale" && isGoal && (
                  <>
                    <div className="mx-auto inline-block rounded-xl bg-corteva-50 px-6 py-3 border border-corteva-200">
                      <p className="text-3xl font-black text-corteva-600">+{goalCount} {goalCount === 1 ? 'GOL' : 'GOLES'}</p>
                    </div>
                    {extraPoints > 0 && (
                      <p className="text-sm font-medium">Te sobran <span className="text-corteva-600">{extraPoints} pts</span>. ¡Faltan {pointsNeeded} pts para otro gol!</p>
                    )}
                  </>
                )}

                {type === "sale" && isPost && (
                  <p>¡Uff, casi! Acumulaste <span className="font-bold text-amber-600">{extraPoints} pts</span>.<br/>¡Te faltan solo <span className="font-bold">{pointsNeeded} pts</span> para el gol!</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8"
              >
                <Button
                  onClick={onClose}
                  className={`h-14 w-full text-lg font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                    isPost 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-gradient-to-r from-corteva-600 to-corteva-500 hover:from-corteva-700 hover:to-corteva-600 text-white'
                  }`}
                >
                  {isPost ? 'SEGUIR JUGANDO 🔄' : '¡VAMOS POR MÁS! 🚀'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
