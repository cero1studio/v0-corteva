"use client"

import Image from "next/image"
import { Loader2 } from "lucide-react"

interface AuthLoadingProps {
  message?: string
}

export function AuthLoading({ message = "Cargando..." }: AuthLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        {/* Logo */}
        <div className="w-64 h-32 relative mx-auto mb-8">
          <Image
            src="/super-ganaderia-logo-black.png"
            alt="Súper Ganadería Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* Spinner animado */}
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-[#006BA6]" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-[#006BA6]/20"></div>
          </div>
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#006BA6]">{message}</h2>
          <p className="text-gray-600 text-sm">Por favor espera mientras cargamos tu información</p>
        </div>

        {/* Indicador de progreso animado */}
        <div className="w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#006BA6] to-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Logo Corteva */}
        <div className="pt-8">
          <div className="w-20 h-10 relative mx-auto opacity-60">
            <Image src="/corteva-logo.png" alt="Corteva Logo" fill style={{ objectFit: "contain" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
