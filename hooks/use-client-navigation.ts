"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface NavigationOptions {
  /**
   * Callback que se ejecuta antes de la navegación
   */
  onBeforeNavigate?: () => void | Promise<void>

  /**
   * Determina si se debe usar window.location.href (true) o router.push (false)
   * @default true
   */
  useWindowLocation?: boolean

  /**
   * Retraso en ms antes de navegar (útil para animaciones)
   * @default 0
   */
  delay?: number
}

/**
 * Hook para manejar navegación del lado del cliente con control de hidratación
 */
export function useClientNavigation() {
  // Estado para controlar si el componente está montado (cliente)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Efecto para establecer el estado montado solo en el cliente
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  /**
   * Navega a la ruta especificada usando window.location.href o router.push
   */
  const navigate = async (path: string, options: NavigationOptions = {}) => {
    const { onBeforeNavigate, useWindowLocation = true, delay = 0 } = options

    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return

    try {
      // Ejecutar callback antes de navegar si existe
      if (onBeforeNavigate) {
        await onBeforeNavigate()
      }

      // Aplicar retraso si es necesario
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      // Navegar usando window.location.href (más confiable para ciertos casos)
      if (useWindowLocation) {
        window.location.href = path
      } else {
        // Importar dinámicamente next/navigation para evitar errores de SSR
        router.push(path)
      }
    } catch (error) {
      console.error("Error durante la navegación:", error)
      // Fallback a window.location si hay error
      window.location.href = path
    }
  }

  /**
   * Renderiza condicionalmente el contenido solo en el cliente
   */
  const ClientOnly = ({
    children,
    fallback = null,
  }: {
    children: React.ReactNode
    fallback?: React.ReactNode
  }) => {
    return isMounted ? <>{children}</> : <>{fallback}</>
  }

  return {
    isMounted,
    navigate,
    ClientOnly,
  }
}
