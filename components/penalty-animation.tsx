"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface PenaltyAnimationProps {
  show: boolean
  onComplete: () => void
}

export function PenaltyAnimation({ show, onComplete }: PenaltyAnimationProps) {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    setIsVisible(show)

    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{
              scale: [0.5, 1.2, 1],
              rotate: [-10, 5, 0],
              transition: { duration: 0.6 },
            }}
            className="relative"
          >
            <div className="relative">
              <Image
                src="/soccer-ball.png"
                alt="Balón de fútbol"
                width={120}
                height={120}
                className="animate-spin-slow"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  opacity: [0, 1, 1],
                  transition: { delay: 0.3, duration: 0.5 },
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="bg-red-600 text-white font-bold text-4xl px-4 py-2 rounded-lg shadow-lg">PENALTY!</div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
