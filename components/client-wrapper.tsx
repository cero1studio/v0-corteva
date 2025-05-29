"use client"

import { useState, useEffect, type ReactNode } from "react"

interface ClientWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  onMount?: () => void
  onUnmount?: () => void
  /**
   * Si es true, no renderiza nada hasta que el componente esté montado
   * @default false
   */
  waitForMount?: boolean
}

/**
 * Componente que envuelve contenido para asegurar que solo se renderice en el cliente
 * Útil para evitar errores de hidratación con código que depende del navegador
 */
export function ClientWrapper({
  children,
  fallback = null,
  onMount,
  onUnmount,
  waitForMount = false,
}: ClientWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Ejecutar callback de montaje si existe
    if (onMount) {
      onMount()
    }

    return () => {
      setIsMounted(false)

      // Ejecutar callback de desmontaje si existe
      if (onUnmount) {
        onUnmount()
      }
    }
  }, [onMount, onUnmount])

  // Si waitForMount es true y no está montado, mostrar fallback
  if (waitForMount && !isMounted) {
    return <>{fallback}</>
  }

  // Renderizar children con un atributo data para debugging
  return <div data-client-hydrated={isMounted}>{children}</div>
}

/**
 * Componente que solo renderiza su contenido en el cliente
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
