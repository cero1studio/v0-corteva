"use client"

import { useState, useEffect } from "react"

/**
 * Hook para manejar redirecciones seguras evitando problemas de hidratación
 * @param redirectPath - Ruta a la que redirigir si se cumplen las condiciones
 * @param shouldRedirect - Función que determina si se debe redirigir
 * @param options - Opciones adicionales
 */
export function useSafeRedirect(
  redirectPath: string,
  shouldRedirect: () => boolean,
  options: {
    delay?: number
    onBeforeRedirect?: () => void | Promise<void>
    immediate?: boolean
  } = {},
) {
  const { delay = 0, onBeforeRedirect, immediate = true } = options
  const [isMounted, setIsMounted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Efecto para manejar el montaje y la redirección
  useEffect(() => {
    setIsMounted(true)

    const handleRedirect = async () => {
      // Verificar si debemos redirigir
      if (shouldRedirect()) {
        setIsRedirecting(true)

        try {
          // Ejecutar callback antes de redirigir si existe
          if (onBeforeRedirect) {
            await onBeforeRedirect()
          }

          // Aplicar retraso si es necesario
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay))
          }

          // Redirigir usando window.location.href
          window.location.href = redirectPath
        } catch (error) {
          console.error("Error durante la redirección:", error)
          setIsRedirecting(false)
          // Intentar redirigir de todos modos en caso de error
          window.location.href = redirectPath
        }
      }
    }

    // Si immediate es true, intentar redirigir inmediatamente después del montaje
    if (immediate) {
      handleRedirect()
    }

    return () => {
      setIsMounted(false)
    }
  }, [redirectPath, shouldRedirect, delay, onBeforeRedirect, immediate])

  // Función para activar la redirección manualmente
  const redirect = async () => {
    if (!isMounted || isRedirecting) return

    setIsRedirecting(true)

    try {
      // Ejecutar callback antes de redirigir si existe
      if (onBeforeRedirect) {
        await onBeforeRedirect()
      }

      // Aplicar retraso si es necesario
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      // Redirigir usando window.location.href
      window.location.href = redirectPath
    } catch (error) {
      console.error("Error durante la redirección:", error)
      setIsRedirecting(false)
      // Intentar redirigir de todos modos en caso de error
      window.location.href = redirectPath
    }
  }

  return {
    isMounted,
    isRedirecting,
    redirect,
  }
}
