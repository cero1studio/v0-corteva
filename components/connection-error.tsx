"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ConnectionErrorProps {
  onRetry?: () => void
}

export function ConnectionError({ onRetry }: ConnectionErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Conexión</AlertTitle>
          <AlertDescription className="mt-2">
            No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.
          </AlertDescription>
        </Alert>

        {onRetry && (
          <Button onClick={onRetry} className="w-full mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}
