"use client"

import { RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ConnectionErrorProps {
  onRetry?: () => void
  message?: string
}

export function ConnectionError({ onRetry, message }: ConnectionErrorProps) {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <WifiOff className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">Error de Conexión</CardTitle>
          <CardDescription className="text-gray-600">
            {message || "No se puede conectar al servidor. Verifica tu conexión a internet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleRefresh} className="w-full" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar Conexión
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Si el problema persiste, contacta al administrador del sistema o intenta más tarde.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
