"use client"

import type React from "react"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface PageLoaderProps {
  isLoading: boolean
  error?: string | null
  children: React.ReactNode
  fallback?: React.ReactNode
  showFallbackAfter?: number // milisegundos
}

export function PageLoader({ isLoading, error, children, fallback, showFallbackAfter = 2000 }: PageLoaderProps) {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowFallback(true)
      }, showFallbackAfter)

      return () => clearTimeout(timer)
    } else {
      setShowFallback(false)
    }
  }, [isLoading, showFallbackAfter])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-red-500 mb-4">⚠️ Error al cargar los datos</div>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Cargando datos...</p>

        {showFallback &&
          (fallback || (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mb-2">La carga está tomando más tiempo de lo esperado</p>
              <button onClick={() => window.location.reload()} className="text-blue-500 hover:underline text-sm">
                Recargar página
              </button>
            </div>
          ))}
      </div>
    )
  }

  return <>{children}</>
}
